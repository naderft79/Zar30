// ============================================
// Zar30 - Price Provider Factory
// ============================================
// انتخاب provider با PRICE_API_PROVIDER:
//   auto (پیش‌فرض) → زنجیره fallback: میلی → tgju
//   mili           → فقط طلای میلی
//   tgju           → فقط tgju
//   tolochart      → adapter خارجی (قدیمی)
//   manual         → فقط ثبت دستی توسط ادمین (provider زنده ندارد)
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import { MiliProvider } from './mili'
import { TgjuProvider } from './tgju'
import { ToloChartProvider } from './tolochart'
import type { GoldPriceProvider, GoldPriceQuote } from './types'

export type { GoldPriceProvider, GoldPriceQuote } from './types'

// زنجیره fallback — providerهای به‌ترتیب اولویت؛ اولین quote معتبر برمی‌گردد
class FallbackPriceProvider implements GoldPriceProvider {
  name = 'auto'

  constructor(private readonly chain: GoldPriceProvider[]) {}

  async fetchPrice(): Promise<GoldPriceQuote> {
    for (const provider of this.chain) {
      try {
        const quote = await provider.fetchPrice()
        // source واقعی برای audit/ثبت قیمت — نام provider موفق
        this.name = `auto:${provider.name}`
        return quote
      } catch {
        // provider بعدی را امتحان کن
      }
    }
    throw FinanceErrors.providerUnavailable('هیچ‌کدام از providerهای قیمت در دسترس نیستند')
  }
}

export function getPriceProvider(): GoldPriceProvider {
  const name = (process.env.PRICE_API_PROVIDER ?? 'auto').toLowerCase()
  switch (name) {
    case 'auto':
      return new FallbackPriceProvider([new MiliProvider(), new TgjuProvider()])
    case 'mili':
      return new MiliProvider()
    case 'tgju':
      return new TgjuProvider()
    case 'tolochart':
      return new ToloChartProvider()
    default:
      throw FinanceErrors.providerUnavailable(
        `provider قیمت «${name}» پشتیبانی نمی‌شود یا پیکربندی نشده است`,
      )
  }
}
