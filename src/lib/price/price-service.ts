// ============================================
// Zar30 - Price Service (Display)
// ============================================
// قیمت نمایشی برای UI — هرگز مبنای اجرای معامله نیست
// (اجرای معامله فقط از طریق finance/pricing.service → GoldPrice)
//
// منبع: آخرین رکورد GoldPrice — عدد جعلی در production تولید نمی‌شود.
// اگر هیچ قیمتی ثبت نشده باشد:
//   - production → source='unavailable' (بدون عدد ساختگی)
//   - development → Mock Provider با source='demo' و isLive=false
// ============================================

import prisma from '@/lib/db/prisma'
import type { GoldPrice, PriceService } from './types'

// تازگی قیمت برای نشان «زنده» — هم‌راستا با PRICE_MAX_AGE_MINUTES معامله
const LIVE_WINDOW_MS = 15 * 60 * 1000

const UNAVAILABLE: GoldPrice = {
  buyPrice: 0,
  sellPrice: 0,
  updatedAt: new Date(0).toISOString(),
  isLive: false,
  source: 'unavailable',
}

class DbPriceService implements PriceService {
  async getCurrentPrice(): Promise<GoldPrice> {
    const price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
    if (!price) return UNAVAILABLE
    return {
      buyPrice: Number(price.buyPrice),
      sellPrice: Number(price.sellPrice),
      updatedAt: price.recordedAt.toISOString(),
      isLive: Date.now() - price.recordedAt.getTime() < LIVE_WINDOW_MS,
      source: price.source,
    }
  }
}

// MOCK — فقط fallback توسعه وقتی هیچ قیمتی در DB نیست
// این عدد هیچ ارتباطی با قیمت واقعی بازار ندارد
const MOCK_BASE_PRICE_RIAL = 8_500_000

class MockPriceService implements PriceService {
  async getCurrentPrice(): Promise<GoldPrice> {
    // نوسان کوچک تصادفی برای شبیه سازی بازار (فقط Demo)
    const jitter = Math.round((Math.random() - 0.5) * 20_000)
    const buyPrice = MOCK_BASE_PRICE_RIAL + jitter
    return {
      buyPrice,
      sellPrice: buyPrice - 50_000,
      updatedAt: new Date().toISOString(),
      isLive: false,
      source: 'demo',
    }
  }
}

const db = new DbPriceService()
const mock = new MockPriceService()

// در Phase 5 Provider خارجی (API + Redis cache) به DbPriceService متصل می شود
export const priceService: PriceService = {
  async getCurrentPrice() {
    const price = await db.getCurrentPrice()
    if (price.source === 'unavailable' && process.env.NODE_ENV !== 'production') {
      return mock.getCurrentPrice()
    }
    return price
  },
}
