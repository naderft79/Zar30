// ============================================
// Zar30 - Platform Settings Reader (Financial Config)
// ============================================
// خواندن تنظیمات مالی از PlatformSetting با fallback به env
// کش کوتاه ۳۰ ثانیه‌ای — تغییر ادمین حداکثر ۳۰s بعد اعمال می‌شود
// شکست DB fail-open به پیش‌فرض env است — هرگز معامله را نمی‌بندد
// ============================================

import prisma from '@/lib/db/prisma'

const CACHE_TTL_MS = 30_000

const cache = new Map<string, { value: unknown; expiresAt: number }>()

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value as T

  try {
    const row = await prisma.platformSetting.findUnique({ where: { key } })
    const value = (row?.value as T | undefined) ?? fallback
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  } catch {
    // شکست DB — هیچ جریان مالی نباید بسته شود
    return fallback
  }
}

// تخفیف فروش (تومان به ازای هر گرم) — key: pricing.sell_discount_toman
export async function getSellDiscountToman(): Promise<bigint> {
  const envDefault = BigInt(Math.round(Number(process.env.PRICE_SELL_DISCOUNT_TOMAN ?? '250000')))
  const raw = await readSetting<unknown>('pricing.sell_discount_toman', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0) return envDefault
  return BigInt(Math.round(n))
}

// حداکثر سن قیمت قابل معامله (دقیقه) — key: pricing.max_age_minutes
export async function getPriceMaxAgeMinutes(): Promise<number> {
  const fallback = Number(process.env.PRICE_MAX_AGE_MINUTES ?? 15)
  const raw = await readSetting<unknown>('pricing.max_age_minutes', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n <= 0 || n > 720) return fallback
  return n
}

// حداکثر انحراف مجاز قیمت جدید (درصد) — key: pricing.max_deviation_percent
export async function getPriceMaxDeviationPercent(): Promise<number> {
  const fallback = Number(process.env.PRICE_MAX_DEVIATION_PERCENT ?? 15)
  const raw = await readSetting<unknown>('pricing.max_deviation_percent', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n <= 0 || n > 100) return fallback
  return n
}

// پاداش دعوت از دوستان — تومان؛ key: referral.reward_toman
export async function getReferralRewardToman(): Promise<bigint> {
  const fallback = BigInt(Math.round(Number(process.env.REFERRAL_REWARD_TOMAN ?? '50000')))
  const raw = await readSetting<unknown>('referral.reward_toman', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0) return fallback
  return BigInt(Math.round(n))
}

// حداقل حجم خرید کاربرِ دعوت‌شده برای qualified شدن معرف — key: referral.min_buy_toman
export async function getReferralMinBuyToman(): Promise<bigint> {
  const fallback = BigInt(Math.round(Number(process.env.REFERRAL_MIN_BUY_TOMAN ?? '1000000')))
  const raw = await readSetting<unknown>('referral.min_buy_toman', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0) return fallback
  return BigInt(Math.round(n))
}

// جریمه دیرکرد اقساط — درصد روزانه؛ key: installment.late_fee_daily_percent
export async function getLateFeeDailyPercent(): Promise<number> {
  const fallback = Number(process.env.INSTALLMENT_LATE_FEE_DAILY_PERCENT ?? 0.5)
  const raw = await readSetting<unknown>('installment.late_fee_daily_percent', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0 || n > 5) return fallback
  return n
}

// کارمزد خرید قسطی — درصد از اعتبار؛ key: installment.buy_fee_percent
export async function getInstallmentBuyFeePercent(): Promise<number> {
  const fallback = Number(process.env.INSTALLMENT_BUY_FEE_PERCENT ?? 0.5)
  const raw = await readSetting<unknown>('installment.buy_fee_percent', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0 || n > 10) return fallback
  return n
}

// کارمزد درگاه پرداخت قسطی — درصد از اعتبار؛ key: installment.gateway_fee_percent
export async function getInstallmentGatewayFeePercent(): Promise<number> {
  const fallback = Number(process.env.INSTALLMENT_GATEWAY_FEE_PERCENT ?? 0.002)
  const raw = await readSetting<unknown>('installment.gateway_fee_percent', null)
  const n = Number(raw)
  if (raw == null || !Number.isFinite(n) || n < 0 || n > 5) return fallback
  return n
}

/** پاک‌کردن کش پس از تغییر ادمین — اعمال فوری */
export function invalidatePlatformConfigCache(key?: string): void {
  if (key) cache.delete(key)
  else cache.clear()
}
