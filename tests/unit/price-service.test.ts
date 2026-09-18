// ============================================
// Zarnama - Price Service Tests
// ============================================
// تست اینترفیس سرویس قیمت — Mock Provider
// ============================================

import { describe, expect, it } from 'vitest'
import { priceService } from '@/lib/price/price-service'

describe('PriceService (Mock)', () => {
  it('قیمت فعلی را با ساختار کامل برمی‌گرداند', async () => {
    const price = await priceService.getCurrentPrice()

    expect(price.buyPrice).toBeGreaterThan(0)
    expect(price.sellPrice).toBeGreaterThan(0)
    expect(price.sellPrice).toBeLessThan(price.buyPrice)
    expect(price.updatedAt).toBeTruthy()
    expect(new Date(price.updatedAt).getTime()).not.toBeNaN()
  })

  it('قیمت Mock هرگز به‌عنوان داده Live علامت نمی‌خورد', async () => {
    const price = await priceService.getCurrentPrice()

    // تضمین عدم نمایش Mock به‌عنوان داده واقعی بازار
    expect(price.isLive).toBe(false)
    expect(price.source).toBe('demo')
  })
})
