// ============================================
// Zar30 - Price Service
// ============================================
// اینترفیس قیمت طلا برای UI
//
// معماری:
//   UI → PriceService → (Mock Provider | Real Provider)
//
// در Phase 5 سرویس قیمت واقعی (API خارجی + Redis cache +
// ذخیره در GoldPrice table) پیاده‌سازی می شود.
// فعلاً Mock Provider فقط در Development فعال است.
// ============================================

import type { GoldPrice, PriceService } from './types'

// قیمت پایه نمایشی — فقط برای Development
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

// در Phase 5 این کلاس با Provider واقعی جایگزین می شود
// class ExternalPriceService implements PriceService { ... }

export function createPriceService(): PriceService {
  // فعلاً فقط Mock — Provider واقعی در Phase 5
  return new MockPriceService()
}

export const priceService = createPriceService()
