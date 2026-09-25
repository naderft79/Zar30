// ============================================
// Zar30 - Fee Engine (Centralized)
// ============================================
// محاسبه کارمزد در یک نقطه — هیچ API حق hardcode کارمزد ندارد
// پیش‌فرض ۵۰ bps (۰٫۵٪) — قابل تنظیم با TRADE_FEE_BPS
// اولویت resolve: UserFeeOverride فردی → FeeRule گروهی → پیش‌فرض
// ============================================

import prisma from '@/lib/db/prisma'

const TRADE_FEE_BPS = BigInt(process.env.TRADE_FEE_BPS ?? '50') // ۰٫۵٪
const BPS_BASE = 10_000n

// حداقل مبلغ سفارش — ASSUMPTION: قابل تنظیم با env
export const MIN_ORDER_TOMAN = BigInt(process.env.MIN_ORDER_TOMAN ?? '10000')
export const MIN_WITHDRAWAL_TOMAN = BigInt(process.env.MIN_WITHDRAWAL_TOMAN ?? '50000')

// کارمزد معامله — همیشه رو به پایین (تومان صحیح)
export function calculateTradeFee(tomanAmount: bigint): bigint {
  if (tomanAmount <= 0n) return 0n
  return (tomanAmount * TRADE_FEE_BPS) / BPS_BASE
}

// کارمزد بر اساس bps دلخواه — برای overrideها
export function feeFromBps(tomanAmount: bigint, bps: bigint): bigint {
  if (tomanAmount <= 0n || bps <= 0n) return 0n
  return (tomanAmount * bps) / BPS_BASE
}

/**
 * resolve کارمزد کاربر:
 * ۱. UserFeeOverride فردی (buyFeeBps/sellFeeBps)
 * ۲. FeeRule گروهی فعال — بالاترین priority برنده است
 *    - KYC_LEVEL: سطح KYC کاربر برابر باشد
 *    - VOLUME: حجم معاملات ۳۰ روز اخیر کاربر ≥ minVolumeToman
 * ۳. پیش‌فرض TRADE_FEE_BPS
 */
export async function resolveTradeFeeBps(userId: string, side: 'BUY' | 'SELL'): Promise<bigint> {
  // ۱. override فردی
  const override = await prisma.userFeeOverride.findUnique({
    where: { userId },
    select: { buyFeeBps: true, sellFeeBps: true },
  })
  const direct = side === 'BUY' ? override?.buyFeeBps : override?.sellFeeBps
  if (direct != null) return BigInt(direct)

  // ۲. قواعد گروهی — سطح KYC کاربر + حجم معاملات ۳۰ روز
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycLevel: true },
  })
  if (!user) return TRADE_FEE_BPS

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const volume = await prisma.order.aggregate({
    _sum: { tomanAmount: true },
    where: { userId, status: 'FILLED', createdAt: { gte: since } },
  })
  const monthlyVolume = volume._sum.tomanAmount ?? 0n

  const rules = await prisma.feeRule.findMany({
    where: { active: true },
    orderBy: { priority: 'desc' },
  })
  for (const rule of rules) {
    const match =
      rule.kind === 'KYC_LEVEL'
        ? rule.kycLevel === user.kycLevel
        : rule.minVolumeToman != null && monthlyVolume >= rule.minVolumeToman
    if (match) {
      return BigInt(side === 'BUY' ? rule.buyFeeBps : rule.sellFeeBps)
    }
  }

  return TRADE_FEE_BPS
}

// کارمزد نهایی یک کاربر — ترکیب resolve + محاسبه
export async function calculateUserTradeFee(
  userId: string,
  tomanAmount: bigint,
  side: 'BUY' | 'SELL',
): Promise<bigint> {
  const bps = await resolveTradeFeeBps(userId, side)
  return feeFromBps(tomanAmount, bps)
}
