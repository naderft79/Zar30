// ============================================
// Zar30 - Pricing Service (Executable Price)
// ============================================
// قیمت قابل معامله از جدول GoldPrice — تنها منبع قیمت engine
// همه قیمت‌ها تومان/گرم هستند.
//
// محافظت‌ها:
//   - PRICE_UNAVAILABLE: قیمت قدیمی‌تر از MAX_AGE (stale)
//   - Abnormal movement: جهش بیش از PRICE_MAX_DEVIATION_PERCENT
//     نسبت به آخرین قیمت → رد (مگر allowAbnormal صریح)
// ============================================

import prisma from '@/lib/db/prisma'
import { Decimal } from './money'
import { FinanceErrors } from './errors'
import { logger } from '@/lib/logger/logger'
import { getPriceProvider, type GoldPriceProvider } from '@/lib/price/providers'
import { checkPriceAlerts } from './price-alert.service'
import { getPriceMaxAgeMinutes, getPriceMaxDeviationPercent } from '@/lib/config/platform-config'

// حداکثر سن قیمت قابل معامله — پیش‌فرض ۱۵ دقیقه (env: PRICE_MAX_AGE_MINUTES)
// قابل بازنویسی از پنل ادمین — key: pricing.max_age_minutes
async function maxAgeMs(): Promise<number> {
  return (await getPriceMaxAgeMinutes()) * 60_000
}
// حداکثر انحراف مجاز قیمت جدید از آخرین قیمت — پیش‌فرض ۱۵٪
// قابل بازنویسی از پنل ادمین — key: pricing.max_deviation_percent
async function maxDeviationPercent(): Promise<number> {
  return getPriceMaxDeviationPercent()
}

export interface ExecutablePrice {
  priceId: string
  buyPrice: bigint // تومان به ازای هر گرم — کاربر با این قیمت می‌خرد
  sellPrice: bigint // تومان به ازای هر گرم — کاربر با این قیمت می‌فروشد
  spread: Decimal
  source: string
  recordedAt: Date
}

let syncInFlight: Promise<unknown> | null = null

// تلاش بهینه برای تازه‌سازی قیمت از provider — شکست provider
// به caller نشت نمی‌کند؛ آخرین قیمت معتبر همچنان پاسخ می‌دهد.
// in-flight dedupe: چند درخواست هم‌زمان فقط یک sync می‌سازند.
export function ensureFreshPrice(): Promise<unknown> {
  syncInFlight ??= syncLivePrice()
    .catch(() => null)
    .finally(() => {
      syncInFlight = null
    })
  return syncInFlight
}

const isFresh = (recordedAt: Date, maxAge: number) => Date.now() - recordedAt.getTime() <= maxAge

// آخرین قیمت معتبر — قدیمی‌تر از حد مجاز → تلاش برای sync زنده، بعد PRICE_UNAVAILABLE (stale)
export async function getExecutablePrice(): Promise<ExecutablePrice> {
  const maxAge = await maxAgeMs()
  let price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
  if (!price || !isFresh(price.recordedAt, maxAge)) {
    await ensureFreshPrice()
    price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
  }
  if (!price || !isFresh(price.recordedAt, maxAge)) throw FinanceErrors.priceUnavailable()
  return {
    priceId: price.id,
    buyPrice: price.buyPrice,
    sellPrice: price.sellPrice,
    spread: new Decimal(price.spread),
    source: price.source,
    recordedAt: price.recordedAt,
  }
}

export interface RecordPriceInput {
  buyPrice: bigint
  sellPrice: bigint
  source: string
  recordedBy?: string
  /** عبور از محافظ جهش غیرعادی — فقط با تصمیم آگاهانه ادمین */
  allowAbnormal?: boolean
}

// بررسی جهش غیرعادی نسبت به آخرین قیمت ثبت‌شده
async function checkAbnormalMovement(sellPrice: bigint, allowAbnormal?: boolean) {
  if (allowAbnormal) return
  const maxDeviation = await maxDeviationPercent()
  const last = await prisma.goldPrice.findFirst({
    orderBy: { recordedAt: 'desc' },
    select: { sellPrice: true },
  })
  if (!last || last.sellPrice <= 0n) return
  const deviation = Math.abs(Number(sellPrice - last.sellPrice)) / Number(last.sellPrice)
  if (deviation * 100 > maxDeviation) {
    throw FinanceErrors.abnormalPrice()
  }
}

// ثبت قیمت جدید — فقط از مسیر ادمین/provider رسمی؛ spread محاسباتی
export async function recordPrice(input: RecordPriceInput) {
  if (input.buyPrice <= 0n || input.sellPrice <= 0n) {
    throw FinanceErrors.invalidAmount('قیمت باید مثبت باشد')
  }
  if (input.sellPrice >= input.buyPrice) {
    throw FinanceErrors.invalidAmount('قیمت فروش باید کمتر از قیمت خرید باشد')
  }
  await checkAbnormalMovement(input.sellPrice, input.allowAbnormal)

  const spread = new Decimal(input.buyPrice.toString())
    .sub(new Decimal(input.sellPrice.toString()))
    .div(new Decimal(input.buyPrice.toString()))
    .toDecimalPlaces(4)

  const price = await prisma.goldPrice.create({
    data: {
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      rawPrice: input.sellPrice, // مبنای خام = قیمت مرجع (فروش)
      spread,
      source: input.source,
      recordedAt: new Date(),
    },
  })

  // هشدارهای قیمت کاربران — fire-and-forget؛ شکست آن قیمت را خراب نمی‌کند
  checkPriceAlerts(input.buyPrice).catch((err) => logger.error({ err }, 'Price alert check failed'))

  return price
}

// همگام‌سازی قیمت زنده از provider — fetch → validate → record
export async function syncLivePrice(opts?: { provider?: GoldPriceProvider }) {
  const provider = opts?.provider ?? getPriceProvider()
  const quote = await provider.fetchPrice()

  // اعتبارسنجی مرز — quote نامعتبر/قدیمی/آینده‌نگر هرگز وارد Core نمی‌شود
  if (quote.buyPrice <= 0n || quote.sellPrice <= 0n || quote.sellPrice > quote.buyPrice) {
    throw FinanceErrors.providerUnavailable('quote نامعتبر از provider')
  }
  const age = Date.now() - quote.timestamp.getTime()
  const maxAge = await maxAgeMs()
  if (age > maxAge || age < -60_000) {
    throw FinanceErrors.providerUnavailable('quote با timestamp نامعتبر از provider')
  }

  return recordPrice({
    buyPrice: quote.buyPrice,
    sellPrice: quote.sellPrice,
    source: provider.name,
    recordedBy: 'provider',
  })
}
