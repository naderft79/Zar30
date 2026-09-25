// ============================================
// Zar30 - Limit Engine (DB-backed)
// ============================================
// LimitRuleهای فعال admin — بازه لغزان DAILY (۲۴h) / MONTHLY (۳۰d)
// علاوه بر سقف‌های پایه KYC_LIMITS اعمال می‌شوند (فقط سفت‌تر می‌کنند)
// قانون سطح‌محور (kycLevel) و سراسری (null) هر دو پشتیبانی می‌شوند
// ============================================

import type { KycLevel, LimitScope } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { Decimal } from './money'
import { FinanceErrors } from './errors'

// شروع بازه لغزان — روزانه ۲۴ ساعت، ماهانه ۳۰ روز گذشته
function periodStart(period: 'DAILY' | 'MONTHLY'): Date {
  const hours = period === 'DAILY' ? 24 : 30 * 24
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

// مصرف کاربر در بازه — بر اساس scope
async function usedInWindow(
  scope: LimitScope,
  userId: string,
  since: Date,
): Promise<{ toman: bigint; gold: Decimal }> {
  switch (scope) {
    case 'WITHDRAW': {
      const r = await prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED', 'PAID'] },
          createdAt: { gte: since },
        },
      })
      return { toman: r._sum.amount ?? 0n, gold: new Decimal(0) }
    }
    case 'TRADE': {
      const r = await prisma.order.aggregate({
        _sum: { total: true },
        where: { userId, status: 'FILLED', createdAt: { gte: since } },
      })
      return { toman: r._sum.total ?? 0n, gold: new Decimal(0) }
    }
    case 'TRANSFER': {
      const r = await prisma.internalTransfer.aggregate({
        _sum: { tomanAmount: true },
        where: { senderId: userId, createdAt: { gte: since } },
      })
      const g = await prisma.internalTransfer.aggregate({
        _sum: { goldAmount: true },
        where: { senderId: userId, createdAt: { gte: since } },
      })
      return { toman: r._sum.tomanAmount ?? 0n, gold: new Decimal(g._sum.goldAmount ?? 0) }
    }
  }
}

const SCOPE_LABEL: Record<LimitScope, string> = {
  WITHDRAW: 'برداشت',
  TRADE: 'معامله',
  TRANSFER: 'انتقال',
}

/**
 * enforce محدودیت — اگر قانون فعالی باشد، مصرف دوره + مبلغ جدید نباید از سقف بگذرد.
 * قوانین سطح‌محور و سراسری هر دو اعمال می‌شوند (محدودکننده‌ترین برنده است).
 */
export async function enforceLimit(
  userId: string,
  kycLevel: KycLevel,
  scope: LimitScope,
  amount: { toman?: bigint; gold?: Decimal | string },
): Promise<void> {
  const rules = await prisma.limitRule.findMany({
    where: { scope, active: true, OR: [{ kycLevel }, { kycLevel: null }] },
  })
  if (rules.length === 0) return

  // محاسبه مصرف یکبار برای هر دوره — DAILY و MONTHLY جدا
  const usage = new Map<'DAILY' | 'MONTHLY', { toman: bigint; gold: Decimal }>()
  for (const rule of rules) {
    const period = rule.period
    if (!usage.has(period)) {
      usage.set(period, await usedInWindow(scope, userId, periodStart(period)))
    }
    const used = usage.get(period)!
    const periodFa = period === 'DAILY' ? 'روزانه' : 'ماهانه'

    if (amount.toman != null && rule.amountToman != null) {
      if (used.toman + amount.toman > rule.amountToman) {
        throw FinanceErrors.limitExceeded(`سقف ${periodFa} ${SCOPE_LABEL[scope]} شما تکمیل شده است`)
      }
    }
    if (amount.gold != null && rule.amountGold != null) {
      const g = new Decimal(amount.gold)
      if (used.gold.add(g).gt(rule.amountGold)) {
        throw FinanceErrors.limitExceeded(`سقف ${periodFa} ${SCOPE_LABEL[scope]} شما تکمیل شده است`)
      }
    }
  }
}
