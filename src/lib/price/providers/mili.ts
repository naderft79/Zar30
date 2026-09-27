// ============================================
// Zar30 - Milli (طلای میلی) Price Provider
// ============================================
// منبع اولیه قیمت زنده — endpoint عمومی widget میلی.
// پاسخ: { code: 0, data: { price18, date } }
//   price18 → قیمت هر گرم طلای ۱۸ عیار آب‌شده، واحد = ۱۰۰ تومان
//   (مثال: 232990 یعنی ۲۳٬۲۹۹٬۰۰۰ تومان/گرم)
//   date    → timestamp منبع (Asia/Tehran)
// مرز واحد: اینجا به تومان normalize می‌شود؛ Core فقط تومان می‌بیند.
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import { platformQuote } from './spread'
import type { GoldPriceProvider, GoldPriceQuote } from './types'

const DEFAULT_URL = 'https://milli.gold/api/v1/public/milli-price/external'

interface MiliResponse {
  code?: number
  data?: { price18?: number; date?: string }
}

export class MiliProvider implements GoldPriceProvider {
  readonly name = 'mili'
  private readonly url = process.env.MILI_API_URL ?? DEFAULT_URL

  async fetchPrice(): Promise<GoldPriceQuote> {
    let json: MiliResponse
    try {
      const res = await fetch(this.url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = (await res.json()) as MiliResponse
    } catch {
      throw FinanceErrors.providerUnavailable('provider میلی در دسترس نیست')
    }

    const price18 = json?.data?.price18
    if (json?.code !== 0 || !price18 || !Number.isFinite(price18) || price18 <= 0) {
      throw FinanceErrors.providerUnavailable('پاسخ میلی قابل تفسیر نیست')
    }

    // timestamp منبع — تهران (+03:30)؛ اگر نامعتبر بود زمان حال
    const raw = json.data?.date
    const parsed = raw ? new Date(`${raw}+03:30`) : undefined
    const timestamp = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined

    // price18 واحدش ۱۰۰ تومان است → تومان/گرم
    return await platformQuote(price18 * 100, timestamp)
  }
}
