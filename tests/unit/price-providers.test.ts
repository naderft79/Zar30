// ============================================
// Zar30 - Price Provider Tests (میلی / tgju / fallback)
// ============================================
// fetch موک می‌شود — هیچ شبکه واقعی در تست صدا زده نمی‌شود.
// مرز واحد: میلی price18 × ۱۰۰ = تومان | tgju ریال ÷ ۱۰ = تومان
// ============================================

import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiliProvider } from '@/lib/price/providers/mili'
import { TgjuProvider } from '@/lib/price/providers/tgju'
import { getPriceProvider } from '@/lib/price/providers'

const SELL_DISCOUNT = 250_000n

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status: ok ? 200 : 500,
      json: async () => payload,
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('MiliProvider', () => {
  it('price18 را به تومان/گرم تبدیل می‌کند و فروش را ۲۵۰٬۰۰۰ کمتر می‌سازد', async () => {
    mockFetch({ code: 0, data: { price18: 232990, date: '2026-09-23T00:05:30' } })
    const quote = await new MiliProvider().fetchPrice()

    expect(quote.buyPrice).toBe(23_299_000n)
    expect(quote.sellPrice).toBe(quote.buyPrice - SELL_DISCOUNT)
    expect(quote.rawPrice).toBe(quote.buyPrice)
    expect(quote.timestamp).toBeInstanceOf(Date)
  })

  it('پاسخ نامعتبر یا code غیرصفر را رد می‌کند', async () => {
    mockFetch({ code: 1, data: {} })
    await expect(new MiliProvider().fetchPrice()).rejects.toThrow()

    mockFetch({ code: 0, data: { price18: 0 } })
    await expect(new MiliProvider().fetchPrice()).rejects.toThrow()

    mockFetch('not-an-object')
    await expect(new MiliProvider().fetchPrice()).rejects.toThrow()
  })

  it('خطای شبکه را به providerUnavailable تبدیل می‌کند', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ENOTFOUND')
      }),
    )
    await expect(new MiliProvider().fetchPrice()).rejects.toThrow()
  })

  it('timestamp نامعتبر را با زمان حال جایگزین می‌کند', async () => {
    mockFetch({ code: 0, data: { price18: 232990, date: 'bad-date' } })
    const quote = await new MiliProvider().fetchPrice()
    expect(Math.abs(Date.now() - quote.timestamp.getTime())).toBeLessThan(5_000)
  })
})

describe('TgjuProvider', () => {
  it('geram18 ریالی را به تومان/گرم تبدیل می‌کند', async () => {
    mockFetch({
      current: {
        geram18: { p: '239,390,000', ts: '2026-09-23 00:05:30' },
      },
    })
    const quote = await new TgjuProvider().fetchPrice()

    expect(quote.buyPrice).toBe(23_939_000n)
    expect(quote.sellPrice).toBe(23_939_000n - SELL_DISCOUNT)
  })

  it('فیلد geram18 غایب یا نامعتبر را رد می‌کند', async () => {
    mockFetch({ current: {} })
    await expect(new TgjuProvider().fetchPrice()).rejects.toThrow()

    mockFetch({ current: { geram18: { p: 'abc' } } })
    await expect(new TgjuProvider().fetchPrice()).rejects.toThrow()
  })
})

describe('Fallback chain (auto)', () => {
  it('میلی اول امتحان می‌شود و موفق برمی‌گردد', async () => {
    vi.stubEnv('PRICE_API_PROVIDER', 'auto')
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 0, data: { price18: 232990, date: '2026-09-23T00:05:30' } }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const provider = getPriceProvider()
    const quote = await provider.fetchPrice()
    expect(provider.name).toBe('auto:mili')
    expect(quote.buyPrice).toBe(23_299_000n)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('با شکست میلی به tgju fallback می‌کند', async () => {
    vi.stubEnv('PRICE_API_PROVIDER', 'auto')
    const fetchMock = vi
      .fn()
      // میلی → DNS/timeout
      .mockRejectedValueOnce(new Error('ENOTFOUND'))
      // tgju → پاسخ معتبر
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: { geram18: { p: '239,390,000', ts: '2026-09-23 00:05:30' } },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const provider = getPriceProvider()
    const quote = await provider.fetchPrice()
    expect(provider.name).toBe('auto:tgju')
    expect(quote.buyPrice).toBe(23_939_000n)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('پاسخ نامعتبر میلی هم به tgju fallback می‌کند', async () => {
    vi.stubEnv('PRICE_API_PROVIDER', 'auto')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ code: 1 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: { geram18: { p: '240,000,000', ts: '2026-09-23 00:05:30' } },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const provider = getPriceProvider()
    const quote = await provider.fetchPrice()
    expect(provider.name).toBe('auto:tgju')
    expect(quote.buyPrice).toBe(24_000_000n)
  })

  it('اگر هر دو provider شکست بخورند، خطا می‌دهد — قیمت جعلی نمی‌سازد', async () => {
    vi.stubEnv('PRICE_API_PROVIDER', 'auto')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(getPriceProvider().fetchPrice()).rejects.toThrow()
  })
})
