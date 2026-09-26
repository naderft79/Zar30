// ============================================
// Zar30 - ZarKar Service (Gold Deposit / سپرده طلا)
// ============================================
// سپرده طلای «زرکار» — طلای کاربر برای مدت طرح قفل و سود ثابت
// دوره‌ای (هر ۳۰ روز) به صورت طلا پرداخت می‌شود:
//   - subscribe: قفل طلا → journal (D ASSET_LOCKED_GOLD / C ASSET_GOLD)
//     + InvestmentPosition(ACTIVE)
//   - پرداخت دوره‌ای: صدور طلا از موجودی پلتفرم →
//     (D ASSET_GOLD کاربر / C LIABILITY_GOLD_INVENTORY) — مانند خرید
//   - سررسید: آخرین پرداخت + آزادسازی قفل →
//     (D ASSET_GOLD / C ASSET_LOCKED_GOLD) + status=MATURED
// rate طرح = درصد کل سود در کل duration (نه سالانه)
// برداشت زودهنگام وجود ندارد — محصول قفل‌شده است
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { Decimal, floorGold } from './money'
import { FinanceErrors } from './errors'
import { postJournal } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { notifyFinancial } from './notify'
import { formatGoldAmount } from '@/lib/utils/format'
import type { KycLevel } from '@/generated/prisma'

// طول هر دوره پرداخت سود — ۳۰ روز
const PERIOD_DAYS = 30
const PERIOD_MS = PERIOD_DAYS * 24 * 60 * 60 * 1000

export async function listZarkarPlans() {
  const plans = await prisma.investmentPlan.findMany({
    where: { active: true },
    orderBy: { durationDays: 'asc' },
  })
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    durationDays: p.durationDays,
    minGoldGram: p.minGoldGram.toString(),
    rate: p.rate.toString(),
    // تعداد دوره‌های پرداخت سود در کل مدت طرح
    periods: Math.max(1, Math.round(p.durationDays / PERIOD_DAYS)),
  }))
}

export async function listUserPositions(userId: string) {
  const positions = await prisma.investmentPosition.findMany({
    where: { userId },
    include: { plan: true, payouts: { orderBy: { paidAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return positions.map((p) => ({
    id: p.id,
    planName: p.plan.name,
    durationDays: p.plan.durationDays,
    rate: p.plan.rate.toString(),
    goldAmount: p.goldAmount.toString(),
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    paidCount: p.payouts.length,
    totalPaid: p.payouts.reduce((acc, x) => acc.add(x.amountGold), new Decimal(0)).toString(),
    payouts: p.payouts.map((x) => ({
      amountGold: x.amountGold.toString(),
      periodStart: x.periodStart,
      periodEnd: x.periodEnd,
      paidAt: x.paidAt,
    })),
  }))
}

// سپرده‌گذاری — قفل طلای کاربر در یک DB transaction
export async function subscribeZarkar(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { planId: string; goldGrams: string },
) {
  if (ctx.kycLevel === 'LEVEL_0') {
    throw FinanceErrors.kycRequired('برای سپرده‌گذاری زرکار، احراز هویت لازم است')
  }
  const grams = new Decimal(input.goldGrams)
  if (!grams.isFinite() || grams.lte(0)) {
    throw FinanceErrors.invalidAmount('مقدار طلا نامعتبر است')
  }
  const plan = await prisma.investmentPlan.findUnique({ where: { id: input.planId } })
  if (!plan || !plan.active) {
    throw ApiError.notFound('طرح زرکار یافت نشد یا غیرفعال است')
  }
  if (grams.lt(plan.minGoldGram)) {
    throw FinanceErrors.invalidAmount(
      `حداقل سپرده این طرح ${formatGoldAmount(plan.minGoldGram.toString())} گرم است`,
    )
  }

  const position = await prisma.$transaction(async (tx) => {
    const gold = await ensureAssetAccount(tx, ctx.userId, 'GOLD')
    const journal = await postJournal(tx, {
      referenceType: 'INVESTMENT_LOCK',
      referenceId: ctx.userId,
      description: `ZarKar subscribe — ${grams.toString()}g locked`,
      legs: [
        {
          account: 'ASSET_LOCKED_GOLD',
          side: 'DEBIT',
          amountGold: grams.toString(),
          assetAccountId: gold.id,
        },
        {
          account: 'ASSET_GOLD',
          side: 'CREDIT',
          amountGold: grams.toString(),
          assetAccountId: gold.id,
        },
      ],
    })
    const startDate = new Date()
    const pos = await tx.investmentPosition.create({
      data: {
        userId: ctx.userId,
        planId: plan.id,
        goldAmount: grams,
        startDate,
        endDate: new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    })
    await tx.journalEntry.update({
      where: { id: journal.id },
      data: { referenceId: pos.id },
    })
    return pos
  })

  notifyFinancial(ctx.userId, 'zarkar_subscribed', 'سپرده زرکار شما فعال شد', '', {
    positionId: position.id,
    goldAmount: grams.toString(),
    planName: plan.name,
  })

  return { id: position.id, status: position.status }
}

// ============================================
// پردازش دوره‌ای — کرون
// ============================================

export async function processZarkarPayouts() {
  const positions = await prisma.investmentPosition.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true, payouts: true },
  })

  let paid = 0
  let matured = 0
  let failed = 0

  for (const pos of positions) {
    try {
      const result = await processPosition(pos)
      paid += result.paid
      matured += result.matured ? 1 : 0
    } catch (err) {
      failed++
      logger.error({ err, positionId: pos.id }, 'ZarKar payout failed for position')
    }
  }
  return { scanned: positions.length, paid, matured, failed }
}

interface PositionWithPlan {
  id: string
  userId: string
  goldAmount: Decimal
  startDate: Date
  endDate: Date
  plan: { name: string; durationDays: number; rate: Decimal }
  payouts: { amountGold: Decimal }[]
}

async function processPosition(pos: PositionWithPlan) {
  const now = Date.now()
  const totalPeriods = Math.max(1, Math.round(pos.plan.durationDays / PERIOD_DAYS))
  const yieldTotal = floorGold(pos.goldAmount.mul(pos.plan.rate).div(100))
  const perPeriod = floorGold(yieldTotal.div(totalPeriods))
  const paidCount = pos.payouts.length

  // دوره‌های سررسیدشده که هنوز پرداخت نشده‌اند
  const dueIdxs: number[] = []
  for (let idx = paidCount + 1; idx <= totalPeriods; idx++) {
    const isLast = idx === totalPeriods
    const dueAt = isLast ? pos.endDate.getTime() : pos.startDate.getTime() + idx * PERIOD_MS
    if (dueAt <= now) dueIdxs.push(idx)
    else break
  }
  if (dueIdxs.length === 0) return { paid: 0, matured: false }

  let paid = 0
  let matured = false

  await prisma.$transaction(async (tx) => {
    // قفل ردیف موقعیت — جلوگیری از پرداخت دوباره در اجرای همزمان کرون
    await tx.$queryRaw`SELECT id FROM investment_positions WHERE id::text = ${pos.id} FOR UPDATE`
    const fresh = await tx.investmentPosition.findUnique({
      where: { id: pos.id },
      include: { payouts: true },
    })
    if (!fresh || fresh.status !== 'ACTIVE') return
    const freshPaid = fresh.payouts.length
    const gold = await ensureAssetAccount(tx, pos.userId, 'GOLD')

    for (const idx of dueIdxs) {
      if (idx <= freshPaid + paid) continue
      const isLast = idx === totalPeriods
      const amount = isLast ? yieldTotal.sub(perPeriod.mul(totalPeriods - 1)) : perPeriod
      const periodEnd = isLast ? pos.endDate : new Date(pos.startDate.getTime() + idx * PERIOD_MS)
      const periodStart =
        idx === 1 ? pos.startDate : new Date(pos.startDate.getTime() + (idx - 1) * PERIOD_MS)

      if (amount.gt(0)) {
        await postJournal(tx, {
          referenceType: 'INVESTMENT_PAYOUT',
          referenceId: pos.id,
          description: `ZarKar payout ${idx}/${totalPeriods} — ${amount.toString()}g`,
          legs: [
            {
              account: 'ASSET_GOLD',
              side: 'DEBIT',
              amountGold: amount.toString(),
              assetAccountId: gold.id,
            },
            {
              account: 'LIABILITY_GOLD_INVENTORY',
              side: 'CREDIT',
              amountGold: amount.toString(),
            },
          ],
        })
      }
      await tx.interestPayout.create({
        data: { positionId: pos.id, amountGold: amount, periodStart, periodEnd },
      })
      paid++

      if (isLast) {
        // آزادسازی اصل سپرده + اتمام موقعیت
        await postJournal(tx, {
          referenceType: 'INVESTMENT_MATURITY',
          referenceId: pos.id,
          description: `ZarKar matured — ${pos.goldAmount.toString()}g unlocked`,
          legs: [
            {
              account: 'ASSET_GOLD',
              side: 'DEBIT',
              amountGold: pos.goldAmount.toString(),
              assetAccountId: gold.id,
            },
            {
              account: 'ASSET_LOCKED_GOLD',
              side: 'CREDIT',
              amountGold: pos.goldAmount.toString(),
              assetAccountId: gold.id,
            },
          ],
        })
        await tx.investmentPosition.update({
          where: { id: pos.id },
          data: { status: 'MATURED', closedAt: new Date() },
        })
        matured = true
      }
    }
  })

  if (paid > 0) {
    notifyFinancial(pos.userId, 'zarkar_payout', 'سود زرکار به کیف طلای شما واریز شد', '', {
      positionId: pos.id,
      matured,
    })
  }
  return { paid, matured }
}
