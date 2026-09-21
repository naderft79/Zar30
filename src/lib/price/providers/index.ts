// ============================================
// Zar30 - Price Provider Factory
// ============================================
// انتخاب provider با PRICE_API_PROVIDER:
//   tolochart → adapter خارجی
//   manual    → فقط ثبت دستی توسط ادمین (provider زنده ندارد)
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import { ToloChartProvider } from './tolochart'
import type { GoldPriceProvider } from './types'

export type { GoldPriceProvider, GoldPriceQuote } from './types'

export function getPriceProvider(): GoldPriceProvider {
  const name = (process.env.PRICE_API_PROVIDER ?? 'manual').toLowerCase()
  if (name === 'tolochart') return new ToloChartProvider()
  throw FinanceErrors.providerUnavailable(
    `provider قیمت «${name}» پشتیبانی نمی‌شود یا پیکربندی نشده است`,
  )
}
