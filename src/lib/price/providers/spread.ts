// ============================================
// Zar30 - Platform Price Quote Builder
// ============================================
// قانون پلتفرم: قیمت خرید کاربر = قیمت خام بازار (تومان/گرم)
// قیمت فروش کاربر = قیمت خرید − تخفیف فروش
// تخفیف از پنل ادمین (PlatformSetting: pricing.sell_discount_toman)
// خوانده می‌شود؛ env فقط fallback اولیه است.
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import { getSellDiscountToman } from '@/lib/config/platform-config'
import type { GoldPriceQuote } from './types'

// تخفیف فروش نسبت به خرید — تومان (ادمین → env fallback)
async function sellDiscountToman(): Promise<bigint> {
  return getSellDiscountToman()
}

export async function platformQuote(
  gramPriceToman: number,
  timestamp?: Date,
): Promise<GoldPriceQuote> {
  const buy = BigInt(Math.round(gramPriceToman))
  if (buy <= 0n) {
    throw FinanceErrors.providerUnavailable('قیمت provider نامعتبر است')
  }
  const discount = await sellDiscountToman()
  const sell = buy - discount
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
