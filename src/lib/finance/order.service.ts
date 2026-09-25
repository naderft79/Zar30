// ============================================
// Zar30 - Order Service (Buy/Sell Engine)
// ============================================
// موتور معاملات آنی — اتمیک داخل یک DB transaction
//
// مدل دفتر کل (مستند در docs/DATABASE.md):
//   خرید (R=مبلغ تومانی، F=کارمزد، G=طلا):
//     CREDIT ASSET_TOMAN[user]        R+F  (ادعای تومانی کاربر کم می‌شود)
//     DEBIT  LIABILITY_USER_TOMAN     R+F  (بدهی پلتفرم به کاربر کم می‌شود)
//     DEBIT  ASSET_PLATFORM_TOMAN     R+F  (صندوق نقد پلتفرم)
//     CREDIT REVENUE_SPREAD          R    (درآمد فروش طلا)
//     CREDIT REVENUE_FEE             F    (کارمزد)
//     DEBIT  ASSET_GOLD[user]        G    (طلای کاربر زیاد می‌شود)
//     CREDIT LIABILITY_GOLD_INVENTORY G   (بدهی طلایی پلتفرم به کاربر)
//   فروش (R=ناخالص تومانی، F=کارمزد، N=R-F خالص):
//     DEBIT  ASSET_TOMAN[user]        N
//     CREDIT LIABILITY_USER_TOMAN     N
//     CREDIT ASSET_PLATFORM_TOMAN     R-F  (خروج نقد)
//     DEBIT  EXPENSE_OPERATIONAL     R    (هزینه بازخرید طلا)
//     CREDIT REVENUE_FEE             F
//     CREDIT ASSET_GOLD[user]        G
//     DEBIT  LIABILITY_GOLD_INVENTORY G
//
//   ASSUMPTION: حساب دارایی انبار طلای پلتفرم وجود ندارد؛ هزینه
//   بازخرید به EXPENSE_OPERATIONAL و کارمزد به REVENUE_FEE می‌رود.
// ============================================

import type { KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { Decimal, tomanToGold, goldToToman, floorGold } from './money'
import { FinanceErrors } from './errors'
import { postJournal, type JournalLeg } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { getExecutablePrice } from './pricing.service'
import { calculateUserTradeFee, MIN_ORDER_TOMAN } from './fee.service'
import { enforceLimit } from './limit.service'
import { KYC_LIMITS } from './limits'
import { notifyFinancial } from './notify'
import { triggerRiskEvaluation } from '@/lib/services/admin-risk.service'

// سقف روزانه معامله بر اساس مجموع سفارش‌های FILLED امروز
async function checkDailyLimit(userId: string, kycLevel: KycLevel, tomanAmount: bigint) {
  const limit = KYC_LIMITS[kycLevel].dailyTradeToman
  if (limit === 0n)
    throw FinanceErrors.kycRequired('برای معامله، احراز هویت سطح ۱ یا بالاتر لازم است')
  if (limit === null) return

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const used = await prisma.order.aggregate({
    where: { userId, status: 'FILLED', createdAt: { gte: dayStart } },
    _sum: { total: true },
  })
  if ((used._sum.total ?? 0n) + tomanAmount > limit) {
    throw FinanceErrors.limitExceeded('سقف معامله روزانه شما تکمیل شده است')
  }
}

export interface OrderResult {
  id: string
  type: 'BUY' | 'SELL'
  goldAmount: string
  tomanAmount: string
  unitPrice: string
  fee: string
  total: string
  status: string
  createdAt: Date
}

function toOrderResult(order: {
  id: string
  type: 'BUY' | 'SELL'
  goldAmount: Decimal
  tomanAmount: bigint
  unitPrice: bigint
  fee: bigint
  total: bigint
  status: string
  createdAt: Date
}): OrderResult {
  return {
    id: order.id,
    type: order.type,
    goldAmount: order.goldAmount.toString(),
    tomanAmount: order.tomanAmount.toString(),
    unitPrice: order.unitPrice.toString(),
    fee: order.fee.toString(),
    total: order.total.toString(),
    status: order.status,
    createdAt: order.createdAt,
  }
}

// خرید طلا — کاربر مبلغ تومانی می‌دهد، طلا دریافت می‌کند
export async function buyGold(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { tomanAmount: bigint },
): Promise<OrderResult> {
  if (input.tomanAmount < MIN_ORDER_TOMAN) {
    throw FinanceErrors.invalidAmount(
      `حداقل مبلغ خرید ${MIN_ORDER_TOMAN.toLocaleString('en')} تومان است`,
    )
  }
  await checkDailyLimit(ctx.userId, ctx.kycLevel, input.tomanAmount)
  // قوانین محدودیت admin (LimitRule) — علاوه بر سقف پایه KYC
  await enforceLimit(ctx.userId, ctx.kycLevel, 'TRADE', { toman: input.tomanAmount })

  const price = await getExecutablePrice()
  const fee = await calculateUserTradeFee(ctx.userId, input.tomanAmount, 'BUY')
  const total = input.tomanAmount + fee
  const goldAmount = tomanToGold(input.tomanAmount, price.buyPrice)
  if (goldAmount.lte(0)) throw FinanceErrors.invalidAmount('مبلغ برای خرید طلا کافی نیست')

  const order = await prisma.$transaction(async (tx) => {
    const toman = await ensureAssetAccount(tx, ctx.userId, 'TOMAN')
    const gold = await ensureAssetAccount(tx, ctx.userId, 'GOLD')

    const legs: JournalLeg[] = [
      { account: 'ASSET_TOMAN', side: 'CREDIT', amountToman: total, assetAccountId: toman.id },
      { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: total },
      { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: total },
      { account: 'REVENUE_SPREAD', side: 'CREDIT', amountToman: input.tomanAmount },
      { account: 'ASSET_GOLD', side: 'DEBIT', amountGold: goldAmount, assetAccountId: gold.id },
      { account: 'LIABILITY_GOLD_INVENTORY', side: 'CREDIT', amountGold: goldAmount },
    ]
    if (fee > 0n) legs.push({ account: 'REVENUE_FEE', side: 'CREDIT', amountToman: fee })

    const journal = await postJournal(tx, {
      referenceType: 'ORDER',
      referenceId: ctx.userId, // بعداً با id سفارش به‌روز می‌شود
      description: `Buy gold — ${goldAmount.toString()}g @ ${price.buyPrice.toString()}`,
      legs,
    })

    return tx.order.create({
      data: {
        userId: ctx.userId,
        type: 'BUY',
        goldAmount,
        tomanAmount: input.tomanAmount,
        unitPrice: price.buyPrice,
        spread: price.spread,
        fee,
        total,
        status: 'FILLED',
        journalEntryId: journal.id,
      },
    })
  })

  // referenceId سند را به id واقعی سفارش وصل می‌کنیم
  await prisma.journalEntry.update({
    where: { id: order.journalEntryId! },
    data: { referenceId: order.id },
  })

  notifyFinancial(ctx.userId, 'order_executed', 'خرید طلا انجام شد', '', {
    orderId: order.id,
    goldAmount: goldAmount.toString(),
    tomanAmount: input.tomanAmount.toString(),
  })
  triggerRiskEvaluation(ctx.userId)

  return toOrderResult(order)
}

// فروش طلا — کاربر مقدار طلا می‌دهد، تومان دریافت می‌کند
export async function sellGold(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { goldAmount: Decimal },
): Promise<OrderResult> {
  const goldAmount = floorGold(input.goldAmount)
  if (goldAmount.lte(0)) throw FinanceErrors.invalidAmount('مقدار طلا باید مثبت باشد')

  const price = await getExecutablePrice()
  const gross = goldToToman(goldAmount, price.sellPrice)
  const fee = await calculateUserTradeFee(ctx.userId, gross, 'SELL')
  const net = gross - fee
  if (net <= 0n) throw FinanceErrors.invalidAmount('مبلغ خالص فروش صفر است')

  await checkDailyLimit(ctx.userId, ctx.kycLevel, gross)
  await enforceLimit(ctx.userId, ctx.kycLevel, 'TRADE', { toman: gross })

  const order = await prisma.$transaction(async (tx) => {
    const toman = await ensureAssetAccount(tx, ctx.userId, 'TOMAN')
    const gold = await ensureAssetAccount(tx, ctx.userId, 'GOLD')

    const legs: JournalLeg[] = [
      { account: 'ASSET_TOMAN', side: 'DEBIT', amountToman: net, assetAccountId: toman.id },
      { account: 'LIABILITY_USER_TOMAN', side: 'CREDIT', amountToman: net },
      { account: 'ASSET_PLATFORM_TOMAN', side: 'CREDIT', amountToman: net },
      { account: 'EXPENSE_OPERATIONAL', side: 'DEBIT', amountToman: gross },
      { account: 'ASSET_GOLD', side: 'CREDIT', amountGold: goldAmount, assetAccountId: gold.id },
      { account: 'LIABILITY_GOLD_INVENTORY', side: 'DEBIT', amountGold: goldAmount },
    ]
    if (fee > 0n) legs.push({ account: 'REVENUE_FEE', side: 'CREDIT', amountToman: fee })

    const journal = await postJournal(tx, {
      referenceType: 'ORDER',
      referenceId: ctx.userId,
      description: `Sell gold — ${goldAmount.toString()}g @ ${price.sellPrice.toString()}`,
      legs,
    })

    return tx.order.create({
      data: {
        userId: ctx.userId,
        type: 'SELL',
        goldAmount,
        tomanAmount: gross,
        unitPrice: price.sellPrice,
        spread: price.spread,
        fee,
        total: net,
        status: 'FILLED',
        journalEntryId: journal.id,
      },
    })
  })

  await prisma.journalEntry.update({
    where: { id: order.journalEntryId! },
    data: { referenceId: order.id },
  })

  notifyFinancial(ctx.userId, 'order_executed', 'فروش طلا انجام شد', '', {
    orderId: order.id,
    goldAmount: goldAmount.toString(),
    tomanAmount: net.toString(),
  })
  triggerRiskEvaluation(ctx.userId)

  return toOrderResult(order)
}

// تاریخچه سفارش‌های کاربر — صفحه‌بندی‌شده
export async function listUserOrders(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ])
  return { items: items.map(toOrderResult), total }
}

// جزئیات سفارش — فقط مالک
export async function getUserOrder(userId: string, orderId: string): Promise<OrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== userId) throw FinanceErrors.orderNotFound()
  return toOrderResult(order)
}
