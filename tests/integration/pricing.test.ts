// ============================================
// Zar30 - Live Price Provider Integration Test
// ============================================
// تست‌های حیاتی قیمت روی PostgreSQL واقعی:
//   quote معتبر → ذخیره | quote قدیمی/آینده‌نگر → رد | جهش غیرعادی → رد
//   quote نامعتبر → رد | قیمت اجرایی stale → PRICE_UNAVAILABLE
// ============================================

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  syncLivePrice,
  getExecutablePrice,
  recordPrice,
} from '../../src/lib/finance/pricing.service'
import type { GoldPriceProvider } from '../../src/lib/price/providers'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SELL = 8_450_000n
const BUY = 8_500_000n

function fakeProvider(
  name: string,
  quote: { buyPrice: bigint; sellPrice: bigint; timestamp: Date },
): GoldPriceProvider {
  return { name, fetchPrice: async () => quote }
}

describe('Live Price Provider (Real PostgreSQL)', () => {
  beforeAll(async () => {
    // شبیه‌سازی شرایط تمیز — قیمت‌های تست قبلی حذف می‌شوند
    await prisma.goldPrice.deleteMany({
      where: { OR: [{ recordedAt: { gt: new Date() } }, { source: { startsWith: 'test' } }] },
    })
    // baseline تست — ممکن است آخرین قیمت واقعی (provider زنده) خیلی دور باشد؛
    // allowAbnormal فقط برای seed اولیه، نه عبور از محافظ در سناریوهای تست
    await recordPrice({
      buyPrice: BUY,
      sellPrice: SELL,
      source: 'test-baseline',
      allowAbnormal: true,
    })
  })

  afterAll(async () => {
    await prisma.goldPrice.deleteMany({ where: { source: { startsWith: 'test' } } })
    await prisma.$disconnect()
  })

  it('۱) quote معتبر provider → ذخیره و قابل معامله', async () => {
    const provider = fakeProvider('test-live', {
      buyPrice: BUY,
      sellPrice: SELL,
      timestamp: new Date(),
    })
    const price = await syncLivePrice({ provider })
    expect(price.source).toBe('test-live')
    expect(price.buyPrice).toBe(BUY)

    const exec = await getExecutablePrice()
    expect(exec.priceId).toBe(price.id)
    expect(exec.sellPrice).toBe(SELL)
  })

  it('۲) quote با timestamp قدیمی → رد', async () => {
    const stale = fakeProvider('test-stale', {
      buyPrice: BUY,
      sellPrice: SELL,
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // یک ساعت پیش
    })
    await expect(syncLivePrice({ provider: stale })).rejects.toThrow()
  })

  it('۳) quote با timestamp آینده → رد', async () => {
    const future = fakeProvider('test-future', {
      buyPrice: BUY,
      sellPrice: SELL,
      timestamp: new Date(Date.now() + 60 * 60 * 1000),
    })
    await expect(syncLivePrice({ provider: future })).rejects.toThrow()
  })

  it('۴) quote نامعتبر (صفر/منفی یا sell>buy) → رد', async () => {
    const zero = fakeProvider('test-zero', {
      buyPrice: 0n,
      sellPrice: 0n,
      timestamp: new Date(),
    })
    await expect(syncLivePrice({ provider: zero })).rejects.toThrow()

    const inverted = fakeProvider('test-inverted', {
      buyPrice: SELL,
      sellPrice: BUY, // فروش گران‌تر از خرید — نامعتبر
      timestamp: new Date(),
    })
    await expect(syncLivePrice({ provider: inverted })).rejects.toThrow()
  })

  it('۵) جهش غیرعادی قیمت → رد', async () => {
    const spike = fakeProvider('test-spike', {
      buyPrice: 20_100_000n,
      sellPrice: 20_000_000n, // +۱۳۷٪ نسبت به آخرین قیمت
      timestamp: new Date(),
    })
    await expect(syncLivePrice({ provider: spike })).rejects.toThrow()

    // قیمت ردشده ذخیره نشده — آخرین قیمت همان قبلی است
    const exec = await getExecutablePrice()
    expect(exec.sellPrice).toBe(SELL)
  })

  it('۶) قیمت اجرایی stale → PRICE_UNAVAILABLE', async () => {
    // تنها قیمت موجود را قدیمی می‌کنیم — خواندن اجرایی باید رد شود
    await prisma.goldPrice.updateMany({
      data: { recordedAt: new Date(Date.now() - 60 * 60 * 1000) },
    })
    // provider را نامعتبر می‌کنیم تا auto-sync شکست بخورد و stale بماند
    vi.stubEnv('PRICE_API_PROVIDER', 'manual')
    try {
      await expect(getExecutablePrice()).rejects.toThrow()
    } finally {
      vi.unstubAllEnvs()
    }

    // بازگردانی قیمت تازه برای تست‌های دیگر — ممکن است provider زنده
    // هم‌زمان قیمت واقعی ثبت کرده باشد؛ seed فقط با allowAbnormal
    await recordPrice({
      buyPrice: BUY,
      sellPrice: SELL,
      source: 'test-restore',
      allowAbnormal: true,
    })
    const exec = await getExecutablePrice()
    expect(exec.sellPrice).toBe(SELL)
  })
})
