// ============================================
// Zar30 - Pricing Service (Executable Price)
// ============================================
// قیمت قابل معامله از جدول GoldPrice — تنها منبع قیمت engine
// قیمت نمایشی (PriceService) از این جدا است؛ این سرویس فقط برای معامله است
// ============================================

import prisma from '@/lib/db/prisma'
import { Decimal } from './money'
import { FinanceErrors } from './errors'

// حداکثر سن قیمت قابل معامله — پیش‌فرض ۱۵ دقیقه (env: PRICE_MAX_AGE_MINUTES)
const MAX_AGE_MS = Number(process.env.PRICE_MAX_AGE_MINUTES ?? 15) * 60_000

export interface ExecutablePrice {
  priceId: string
  buyPrice: bigint // ریال به ازای هر گرم — کاربر با این قیمت می‌خرد
  sellPrice: bigint // ریال به ازای هر گرم — کاربر با این قیمت می‌فروشد
  spread: Decimal
  source: string
  recordedAt: Date
}

// آخرین قیمت معتبر — قدیمی‌تر از MAX_AGE → PRICE_UNAVAILABLE
export async function getExecutablePrice(): Promise<ExecutablePrice> {
  const price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
  if (!price) throw FinanceErrors.priceUnavailable()
  if (Date.now() - price.recordedAt.getTime() > MAX_AGE_MS) {
    throw FinanceErrors.priceUnavailable()
  }
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
}

// ثبت قیمت جدید — فقط از مسیر ادمین/provider رسمی؛ spread محاسباتی
export async function recordPrice(input: RecordPriceInput) {
  if (input.buyPrice <= 0n || input.sellPrice <= 0n) {
    throw FinanceErrors.invalidAmount('قیمت باید مثبت باشد')
  }
  if (input.sellPrice >= input.buyPrice) {
    throw FinanceErrors.invalidAmount('قیمت فروش باید کمتر از قیمت خرید باشد')
  }
  const spread = new Decimal(input.buyPrice.toString())
    .sub(new Decimal(input.sellPrice.toString()))
    .div(new Decimal(input.buyPrice.toString()))
    .toDecimalPlaces(4)

  return prisma.goldPrice.create({
    data: {
      buyPrice: input.buyPrice,
      sellPrice: input.sellPrice,
      rawPrice: input.sellPrice, // مبنای خام = قیمت مرجع (فروش)
      spread,
      source: input.source,
      recordedAt: new Date(),
    },
  })
}
