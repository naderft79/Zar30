// ============================================
// Zar30 - Installment Service (خرید قسطی واقعی)
// ============================================
// جریان: طرح (DB) → درخواست قرارداد → بررسی ادمین → ACTIVE → اقساط ماهانه
//
// مدل مالی:
//   principal      = مبلغ خرید (تومان)
//   downPayment    = درصد پیش‌پرداخت از طرح
//   financed       = principal − downPayment
//   اقساط          = annuity(financed, نرخ ماهانه طرح, months) — رند به تومان
//   totalPayable   = downPayment + Σ اقساط
//
// جریان خرید (در صدور قرارداد — ادمین approve):
//   کاربر باید downPayment را در کیف پول داشته باشد:
//     CREDIT ASSET_TOMAN[user]        downPayment
//     DEBIT  LIABILITY_USER_TOMAN     downPayment
//     DEBIT  ASSET_PLATFORM_TOMAN     downPayment
//     CREDIT REVENUE_INSTALLMENT      downPayment (بیع — مثل خرید نقدی؛ اجرت از spread)
//     DEBIT  ASSET_GOLD[user]         goldAmount
//     CREDIT LIABILITY_GOLD_INVENTORY goldAmount
//   طلا بلافاصله به کاربر تعلق می‌گیرد و در طول طرح تومانی می‌پردازد.
//
//   پرداخت قسط (کاربر از کیف پول):
//     CREDIT ASSET_TOMAN[user]  قسط+جریمه
//     DEBIT  ASSET_PLATFORM_TOMAN  قسط
//     CREDIT REVENUE_INSTALLMENT  جریمه دیرکرد (در صورت وجود)
//
// محافظت‌ها: قفل ردیفی قرارداد، پرداخت قسط idempotent per (contract, number) —
// قسط پرداخت‌شده دوباره قابل پرداخت نیست، کرون جریمه/نکول با قفل.
// ============================================

import { prisma } from '@/lib/db/prisma'
import { Decimal, tomanToGold } from '@/lib/finance/money'
import { FinanceErrors } from '@/lib/finance/errors'
import { ApiError } from '@/lib/errors/api-error'
import { postJournal, type JournalLeg } from '@/lib/finance/ledger.service'
import { ensureAssetAccount } from '@/lib/finance/wallet.service'
import { getExecutablePrice } from '@/lib/finance/pricing.service'
import { notifyFinancial } from '@/lib/finance/notify'
import { isTradingHalted } from '@/lib/services/admin-system.service'
import {
  getInstallmentBuyFeePercent,
  getInstallmentGatewayFeePercent,
  getLateFeeDailyPercent,
} from '@/lib/config/platform-config'
import type { KycLevel } from '@/generated/prisma'

// رند به نزدیک‌ترین تومان
function roundToman(d: Decimal): bigint {
  return BigInt(d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0))
}

// قسط ماهانه annuity — نرخ سالانه طرح، تقسیم بر ۱۲
export function annuityInstallment(
  financed: bigint,
  annualRatePercent: Decimal | string,
  months: number,
): bigint {
  const monthlyRate = new Decimal(annualRatePercent.toString()).div(100).div(12)
  const P = new Decimal(financed.toString())
  if (months <= 0) throw FinanceErrors.invalidAmount('تعداد اقساط نامعتبر است')
  if (monthlyRate.lte(0)) return roundToman(P.div(months))
  const factor = new Decimal(1).plus(monthlyRate).pow(months)
  return roundToman(P.mul(monthlyRate).mul(factor).div(factor.minus(1)))
}

interface PlanRow {
  id: string
  name: string
  months: number
  downPaymentPercent: Decimal
  interestRate: Decimal
  fee: Decimal
  minAmount: bigint
  maxAmount: bigint
  serviceFeePer10M: bigint
  active: boolean
}

function mapPlan(p: PlanRow) {
  return {
    id: p.id,
    name: p.name,
    months: p.months,
    downPaymentPercent: p.downPaymentPercent.toString(),
    interestRate: p.interestRate.toString(),
    fee: p.fee.toString(),
    minAmount: p.minAmount.toString(),
    maxAmount: p.maxAmount.toString(),
    serviceFeePer10M: p.serviceFeePer10M.toString(),
  }
}

// لیست طرح‌های فعال — برای انتخاب کاربر
export async function listInstallmentPlans() {
  const plans = await prisma.installmentPlan.findMany({
    where: { active: true },
    orderBy: { months: 'asc' },
  })
  return plans.map(mapPlan)
}

// پیش‌نمایش قرارداد — بدون ثبت؛ محاسبه سمت سرور
export async function quoteInstallment(input: { planId: string; principal: bigint }) {
  const plan = await prisma.installmentPlan.findUnique({ where: { id: input.planId } })
  if (!plan || !plan.active) throw ApiError.notFound('طرح اقساطی یافت نشد یا غیرفعال است')
  if (input.principal < plan.minAmount || input.principal > plan.maxAmount) {
    throw FinanceErrors.invalidAmount('مبلغ خرید خارج از بازه مجاز این طرح است')
  }

  const downPayment = roundToman(
    new Decimal(input.principal.toString()).mul(plan.downPaymentPercent).div(100),
  )
  const financed = input.principal - downPayment
  const installment = annuityInstallment(financed, plan.interestRate, plan.months)
  const totalInstallments = installment * BigInt(plan.months)
  const totalPayable = downPayment + totalInstallments

  // هزینه خدمات — مقیاس به هر ۱۰ میلیون تومان اعتبار
  const serviceFee = roundToman(
    new Decimal(input.principal.toString()).div(10_000_000).mul(plan.serviceFeePer10M.toString()),
  )
  // کارمزد خرید و درگاه — درصد از اعتبار (تنظیمات ادمین)
  const [buyFeePercent, gatewayFeePercent] = await Promise.all([
    getInstallmentBuyFeePercent(),
    getInstallmentGatewayFeePercent(),
  ])
  const buyFee = roundToman(new Decimal(input.principal.toString()).mul(buyFeePercent).div(100))
  const gatewayFee = roundToman(
    new Decimal(input.principal.toString()).mul(gatewayFeePercent).div(100),
  )

  return {
    plan: mapPlan(plan),
    principal: input.principal.toString(),
    downPayment: downPayment.toString(),
    financed: financed.toString(),
    installment: installment.toString(),
    months: plan.months,
    totalPayable: totalPayable.toString(),
    serviceFee: serviceFee.toString(),
    buyFee: buyFee.toString(),
    gatewayFee: gatewayFee.toString(),
    feesTotal: (serviceFee + buyFee + gatewayFee).toString(),
  }
}

// ثبت درخواست قرارداد — PENDING؛ روش CHEQUE نیاز به شماره/تصویر چک دارد
export async function requestInstallmentContract(
  ctx: { userId: string; kycLevel: KycLevel },
  input: {
    planId: string
    principal: bigint
    method: 'INTERNAL_CREDIT' | 'CHEQUE'
    chequeNumber?: string
  },
) {
  if (await isTradingHalted()) throw FinanceErrors.tradingHalted()
  if (ctx.kycLevel === 'LEVEL_0') {
    throw FinanceErrors.kycRequired('برای خرید قسطی، احراز هویت لازم است')
  }

  const quote = await quoteInstallment({ planId: input.planId, principal: input.principal })

  if (input.method === 'CHEQUE' && !input.chequeNumber) {
    throw FinanceErrors.invalidAmount('برای روش چک، شماره چک صیادی الزامی است')
  }

  const contract = await prisma.installmentContract.create({
    data: {
      userId: ctx.userId,
      planId: input.planId,
      principal: input.principal,
      downPayment: BigInt(quote.downPayment),
      totalPayable: BigInt(quote.totalPayable),
      method: input.method,
      status: 'PENDING',
      chequeNumber: input.chequeNumber,
    },
  })

  notifyFinancial(ctx.userId, 'installment_requested', 'درخواست خرید قسطی ثبت شد', '', {
    contractId: contract.id,
    principal: input.principal.toString(),
  })

  return { id: contract.id, status: contract.status, quote }
}

// تایید ادمین — صدور قرارداد: وصول پیش‌پرداخت + تحویل طلا + تولید جدول اقساط
export async function approveInstallmentContract(
  ctx: { adminId: string },
  contractId: string,
): Promise<{ id: string; status: string }> {
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      {
        id: string
        status: string
        user_id: string
        principal: bigint
        down_payment: bigint
        method: string
      }[]
    >`
      SELECT id, status::text AS status, "user_id"::text AS "user_id",
             principal, "down_payment" AS "down_payment", method::text AS method
      FROM installment_contracts WHERE id::text = ${contractId} FOR UPDATE
    `
    const c = locked[0]
    if (!c) throw ApiError.notFound('قرارداد یافت نشد')
    if (c.status !== 'PENDING') {
      throw FinanceErrors.invalidState('این قرارداد قبلاً پردازش شده است')
    }

    // قیمت اجرایی — طلا با قیمت لحظه‌ای صدور
    const price = await getExecutablePrice()
    const goldAmount = tomanToGold(c.principal, price.buyPrice)
    if (goldAmount.lte(0)) throw FinanceErrors.invalidAmount('مبلغ برای خرید طلا کافی نیست')

    const toman = await ensureAssetAccount(tx, c.user_id, 'TOMAN')
    const gold = await ensureAssetAccount(tx, c.user_id, 'GOLD')

    // وصول پیش‌پرداخت (باید در کیف پول باشد) + تحویل طلا
    // طلا از انبار پلتفرم خارج و به کاربر داده می‌شود؛ پیش‌پرداخت درآمد پلتفرم:
    //   C ASSET_TOMAN[user]             پیش‌پرداخت (کاهش موجودی کاربر)
    //   D ASSET_PLATFORM_TOMAN          پیش‌پرداخت (وصول نقد پلتفرم)
    //   D ASSET_GOLD[user]              طلا (افزایش موجودی کاربر)
    //   C LIABILITY_GOLD_INVENTORY      طلا (کاهش انبار)
    //   تفاوت principal − downPayment = طلب پلتفرم از کاربر:
    //   C ASSET_PLATFORM_TOMAN          خروج نقد معادل بقیه ارزش طلا
    //   D EXPENSE_OPERATIONAL           هزینه بازخرید طلا (مثل فروش نقدی معکوس)
    const legs: JournalLeg[] = [
      {
        account: 'ASSET_TOMAN',
        side: 'CREDIT',
        amountToman: c.down_payment,
        assetAccountId: toman.id,
      },
      { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: c.down_payment },
      { account: 'ASSET_GOLD', side: 'DEBIT', amountGold: goldAmount, assetAccountId: gold.id },
      { account: 'LIABILITY_GOLD_INVENTORY', side: 'CREDIT', amountGold: goldAmount },
      {
        account: 'ASSET_PLATFORM_TOMAN',
        side: 'CREDIT',
        amountToman: c.principal - c.down_payment,
      },
      { account: 'EXPENSE_OPERATIONAL', side: 'DEBIT', amountToman: c.principal - c.down_payment },
    ]
    const journal = await postJournal(tx, {
      referenceType: 'INSTALLMENT_CONTRACT',
      referenceId: c.id,
      description: `Installment issuance — principal ${c.principal.toString()} TOMAN, down ${c.down_payment.toString()}`,
      legs,
    })

    const contract = await tx.installmentContract.findUniqueOrThrow({
      where: { id: c.id },
      include: { plan: { select: { interestRate: true, months: true } } },
    })

    // جدول اقساط — سررسید ماهانه از امروز
    const installment = annuityInstallment(
      c.principal - c.down_payment,
      contract.plan.interestRate,
      contract.plan.months,
    )
    const now = Date.now()
    const payments = Array.from({ length: contract.plan.months }, (_, i) => ({
      contractId: c.id,
      installmentNumber: i + 1,
      dueDate: new Date(now + (i + 1) * 30 * 24 * 60 * 60 * 1000),
      amount: installment,
      status: 'PENDING' as const,
    }))
    await tx.installmentPayment.createMany({ data: payments })

    const updated = await tx.installmentContract.update({
      where: { id: c.id },
      data: { status: 'ACTIVE', approvedBy: ctx.adminId, approvedAt: new Date() },
    })

    await tx.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: ctx.adminId,
        action: 'installment.approve',
        entityType: 'installment_contract',
        entityId: c.id,
        targetUserId: c.user_id,
        after: {
          principal: c.principal.toString(),
          goldAmount: goldAmount.toString(),
          journalId: journal.id,
        },
      },
    })

    return { contract: updated, userId: c.user_id, principal: c.principal.toString() }
  })

  notifyFinancial(result.userId, 'installment_approved', 'قرارداد قسطی شما فعال شد', '', {
    contractId: result.contract.id,
    principal: result.principal,
  })

  return { id: result.contract.id, status: result.contract.status }
}

// رد ادمین
export async function rejectInstallmentContract(
  ctx: { adminId: string },
  contractId: string,
  reason: string,
) {
  const updated = await prisma.installmentContract.updateMany({
    where: { id: contractId, status: 'PENDING' },
    data: { status: 'DEFAULTED' }, // رد شده → بسته (بدون اثر مالی)
  })
  if (updated.count === 0) throw FinanceErrors.invalidState('قرارداد قابل رد نیست')
  await prisma.auditLog.create({
    data: {
      actorType: 'admin',
      actorId: ctx.adminId,
      action: 'installment.reject',
      entityType: 'installment_contract',
      entityId: contractId,
      reason,
    },
  })
  return { rejected: updated.count }
}

// جزئیات قرارداد کاربر — با جدول اقساط
export async function getUserContract(userId: string, contractId: string) {
  const contract = await prisma.installmentContract.findUnique({
    where: { id: contractId },
    include: { plan: true, payments: { orderBy: { installmentNumber: 'asc' } } },
  })
  if (!contract || contract.userId !== userId) throw ApiError.notFound('قرارداد یافت نشد')

  return {
    id: contract.id,
    status: contract.status,
    method: contract.method,
    principal: contract.principal.toString(),
    downPayment: contract.downPayment.toString(),
    totalPayable: contract.totalPayable.toString(),
    plan: {
      name: contract.plan.name,
      months: contract.plan.months,
      interestRate: contract.plan.interestRate.toString(),
    },
    payments: contract.payments.map((p) => ({
      number: p.installmentNumber,
      dueDate: p.dueDate,
      amount: p.amount.toString(),
      lateFee: p.lateFee.toString(),
      status: p.status,
      paidAt: p.paidAt,
    })),
  }
}

// لیست قراردادهای کاربر
export async function listUserContracts(userId: string) {
  const rows = await prisma.installmentContract.findMany({
    where: { userId },
    include: { plan: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((c) => ({
    id: c.id,
    status: c.status,
    method: c.method,
    principal: c.principal.toString(),
    downPayment: c.downPayment.toString(),
    totalPayable: c.totalPayable.toString(),
    plan: { name: c.plan.name, months: c.plan.months },
    paidCount: c.payments.filter((p) => p.status === 'PAID').length,
    nextDueDate:
      c.payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE')?.dueDate ?? null,
    overdueCount: c.payments.filter((p) => p.status === 'OVERDUE').length,
  }))
}

// پرداخت قسط — از کیف پول تومانی؛ قسط + جریمه دیرکرد
export async function payInstallment(
  ctx: { userId: string; kycLevel: KycLevel },
  contractId: string,
  installmentNumber: number,
) {
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; status: string; user_id: string }[]>`
      SELECT id, status::text AS status, "user_id"::text AS "user_id"
      FROM installment_contracts WHERE id::text = ${contractId} FOR UPDATE
    `
    const c = locked[0]
    if (!c || c.user_id !== ctx.userId) throw ApiError.notFound('قرارداد یافت نشد')
    if (c.status !== 'ACTIVE') {
      throw FinanceErrors.invalidState('این قرارداد فعال نیست')
    }

    const payment = await tx.installmentPayment.findFirst({
      where: { contractId: c.id, installmentNumber },
    })
    if (!payment) throw ApiError.notFound('قسط یافت نشد')
    if (payment.status === 'PAID') {
      throw FinanceErrors.invalidState('این قسط قبلاً پرداخت شده است')
    }

    const total = payment.amount + payment.lateFee
    const toman = await ensureAssetAccount(tx, ctx.userId, 'TOMAN')

    // پرداخت قسط: پول از کاربر به صندوق پلتفرم؛ هزینه معکوس‌شده = سود پلتفرم
    //   C ASSET_TOMAN[user]        کل پرداختی (کاهش موجودی)
    //   D ASSET_PLATFORM_TOMAN     اصل قسط (وصول نقد)
    //   D EXPENSE_OPERATIONAL      اصل قسط (برگشت هزینه صدور)
    //   C REVENUE_INSTALLMENT      اصل قسط (درآمد نهایی)
    // جریمه دیرکرد درآمد مستقیم است
    const legs: JournalLeg[] = [
      { account: 'ASSET_TOMAN', side: 'CREDIT', amountToman: total, assetAccountId: toman.id },
      { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: payment.amount },
      { account: 'EXPENSE_OPERATIONAL', side: 'DEBIT', amountToman: payment.amount },
      { account: 'REVENUE_INSTALLMENT', side: 'CREDIT', amountToman: payment.amount },
    ]
    if (payment.lateFee > 0n) {
      legs.push({ account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: payment.lateFee })
      legs.push({ account: 'REVENUE_INSTALLMENT', side: 'CREDIT', amountToman: payment.lateFee })
    }

    const journal = await postJournal(tx, {
      referenceType: 'INSTALLMENT_PAYMENT',
      referenceId: payment.id,
      description: `Installment #${installmentNumber} — contract ${c.id}`,
      legs,
    })

    const updated = await tx.installmentPayment.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: new Date() },
    })

    // قرارداد کامل شد؟
    const remaining = await tx.installmentPayment.count({
      where: { contractId: c.id, status: { not: 'PAID' } },
    })
    if (remaining === 0) {
      await tx.installmentContract.update({ where: { id: c.id }, data: { status: 'COMPLETED' } })
    }

    await tx.auditLog.create({
      data: {
        actorType: 'user',
        actorId: ctx.userId,
        action: 'installment.pay',
        entityType: 'installment_payment',
        entityId: payment.id,
        after: {
          amount: payment.amount.toString(),
          lateFee: payment.lateFee.toString(),
          journalId: journal.id,
        },
      },
    })

    return { payment: updated, completed: remaining === 0, userId: ctx.userId }
  })

  notifyFinancial(result.userId, 'installment_paid', 'قسط شما پرداخت شد', '', {
    contractId,
    installmentNumber,
  })

  return {
    installmentNumber,
    amount: result.payment.amount.toString(),
    lateFee: result.payment.lateFee.toString(),
    status: result.payment.status,
    contractCompleted: result.completed,
  }
}

// کرون — جریمه دیرکرد + نکول — با محافظت قفل
export async function processInstallmentOverdue() {
  const now = new Date()
  const lateFeePercent = await getLateFeeDailyPercent()
  if (lateFeePercent <= 0) return { scanned: 0, penalized: 0, defaulted: 0 }

  // اقساط PENDING گذشته از سررسید → OVERDUE + جریمه روزانه (محاسبه از تعداد روز گذشته)
  const overdue = await prisma.installmentPayment.findMany({
    where: { status: 'PENDING', dueDate: { lt: now } },
    include: { contract: true },
  })

  let penalized = 0
  let defaulted = 0
  for (const p of overdue) {
    try {
      const daysLate = Math.floor((now.getTime() - p.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      if (daysLate <= 0) continue
      const fee = roundToman(
        new Decimal(p.amount.toString()).mul(lateFeePercent).div(100).mul(daysLate),
      )
      const updated = await prisma.installmentPayment.updateMany({
        where: { id: p.id, status: 'PENDING' },
        data: { status: 'OVERDUE', lateFee: { increment: fee } },
      })
      if (updated.count > 0) penalized++

      // نکول — بیش از ۹۰ روز دیرکرد
      if (daysLate > 90) {
        const contractDefaulted = await prisma.installmentContract.updateMany({
          where: { id: p.contractId, status: 'ACTIVE' },
          data: { status: 'DEFAULTED' },
        })
        if (contractDefaulted.count > 0) defaulted++
      }
    } catch (err) {
      console.error('installment overdue processing failed', { paymentId: p.id, err })
    }
  }

  return { scanned: overdue.length, penalized, defaulted }
}
