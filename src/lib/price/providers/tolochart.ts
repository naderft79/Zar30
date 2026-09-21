// ============================================
// Zar30 - ToloChart Price Provider Adapter
// ============================================
// Adapter API خارجی قیمت طلا.
// مرز واحد: پاسخ provider اینجا به «تومان/گرم» normalize می‌شود —
// Financial Core فقط تومان می بیند.
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import type { GoldPriceProvider, GoldPriceQuote } from './types'

// فیلدهای رایج پاسخ APIهای قیمت طلای ایران (تومان/گرم ۱۸ عیار)
function extractGramPrice(json: Record<string, unknown>): number | null {
  const candidates = [
    'price_gram_gol18',
    'gold_18k_price',
    'geram18',
    'gold18',
    'price',
    'value',
    'close',
    'last',
  ]
  for (const key of candidates) {
    const v = json[key]
    if (typeof v === 'number' && v > 0) return v
    if (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) return Number(v)
  }
  // ساختار تودرتو رایج: { data: {...} } یا { gold: { price18: ... } }
  for (const nested of Object.values(json)) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = extractGramPrice(nested as Record<string, unknown>)
      if (inner) return inner
    }
  }
  return null
}

export class ToloChartProvider implements GoldPriceProvider {
  readonly name = 'tolochart'

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly spreadPercent: number

  constructor() {
    this.baseUrl = process.env.PRICE_API_URL ?? ''
    this.apiKey = process.env.PRICE_API_KEY ?? ''
    this.spreadPercent = Number(process.env.BUSINESS_SPREAD_PERCENT ?? '0.5')
  }

  async fetchPrice(): Promise<GoldPriceQuote> {
    if (!this.baseUrl || !this.apiKey) {
      throw FinanceErrors.providerUnavailable('تنظیمات provider قیمت کامل نیست')
    }

    let json: unknown
    try {
      const res = await fetch(`${this.baseUrl}/gold/price`, {
        headers: { 'x-api-key': this.apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = await res.json()
    } catch {
      throw FinanceErrors.providerUnavailable()
    }

    const gramToman = extractGramPrice(json as Record<string, unknown>)
    if (!gramToman || !Number.isFinite(gramToman) || gramToman <= 0) {
      throw FinanceErrors.providerUnavailable('پاسخ provider قابل تفسیر نیست')
    }

    // خروجی تومان — خرید/فروش با spread پلتفرم از قیمت خام
    const sell = BigInt(Math.round(gramToman))
    const buy = BigInt(Math.round(gramToman * (1 + this.spreadPercent / 100)))
    return {
      buyPrice: buy,
      sellPrice: sell,
      rawPrice: sell,
      timestamp: new Date(),
    }
  }
}
