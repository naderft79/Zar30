// ============================================
// Zar30 - Platform Price Quote Builder
// ============================================
// قانون پلتفرم: قیمت خرید کاربر = قیمت خام بازار (تومان/گرم)
// قیمت فروش کاربر = قیمت خرید − تخفیف ثابت (پیش‌فرض ۲۵۰٬۰۰۰ تومان)
// مقدار تخفیف با env قابل تنظیم است و در فاز بعدی از پنل ادمین
// مدیریت می‌شود.
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import type { GoldPriceQuote } from './types'

// تخفیف ثابت فروش نسبت به خرید — تومان (env: PRICE_SELL_DISCOUNT_TOMAN)
const SELL_DISCOUNT_TOMAN = BigInt(
  Math.round(Number(process.env.PRICE_SELL_DISCOUNT_TOMAN ?? '250000')),
)

export function platformQuote(gramPriceToman: number, timestamp?: Date): GoldPriceQuote {
  const buy = BigInt(Math.round(gramPriceToman))
  if (buy <= 0n) {
    throw FinanceErrors.providerUnavailable('قیمت provider نامعتبر است')
  }
  const sell = buy - SELL_DISCOUNT_TOMAN
  if (sell <= 0n) {
    throw FinanceErrors.providerUnavailable('قیمت provider کمتر از کف اسپرد پلتفرم است')
  }
  return {
    buyPrice: buy,
    sellPrice: sell,
    rawPrice: buy,
    timestamp: timestamp ?? new Date(),
  }
}
