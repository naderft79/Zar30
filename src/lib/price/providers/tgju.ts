// ============================================
// Zar30 - TGJU Price Provider (Fallback)
// ============================================
// منبع fallback قیمت زنده — endpoint عمومی tgju (ajax.json).
// فیلد هدف: current.geram18.p → قیمت یک گرم طلای ۱۸ عیار به ریال
// (با جداکننده کاما) + ts = timestamp منبع.
// مرز واحد: ریال → تومان اینجا انجام می‌شود؛ Core فقط تومان می‌بیند.
// ============================================

import { FinanceErrors } from '@/lib/finance/errors'
import { platformQuote } from './spread'
import type { GoldPriceProvider, GoldPriceQuote } from './types'

const DEFAULT_URL = 'https://call.tgju.org/ajax.json'

interface TgjuItem {
  p?: string
  ts?: string
}

export class TgjuProvider implements GoldPriceProvider {
  readonly name = 'tgju'
  private readonly url = process.env.TGJU_API_URL ?? DEFAULT_URL

  async fetchPrice(): Promise<GoldPriceQuote> {
    let json: unknown
    try {
      const res = await fetch(this.url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = await res.json()
    } catch {
      throw FinanceErrors.providerUnavailable('provider tgju در دسترس نیست')
    }

    const item = (json as { current?: Record<string, TgjuItem> })?.current?.geram18
    const raw = item?.p?.replaceAll(',', '')
    const rialPerGram = raw ? Number(raw) : NaN
    if (!Number.isFinite(rialPerGram) || rialPerGram <= 0) {
      throw FinanceErrors.providerUnavailable('پاسخ tgju قابل تفسیر نیست')
    }

    // timestamp منبع — اگر نامعتبر/غایب بود، زمان حال
    const ts = item?.ts ? new Date(item.ts.replace(' ', 'T') + '+03:30') : undefined
    const timestamp = ts && !Number.isNaN(ts.getTime()) ? ts : undefined

    return platformQuote(rialPerGram / 10, timestamp)
  }
}
