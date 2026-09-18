// ============================================
// Zarnama - Price Section (Server)
// ============================================
// بخش قیمت طلا — PriceWidget + GoldCalculator
// قیمت اولیه از PriceService (فعلاً Mock/Demo)
// ============================================

import { priceService } from '@/lib/price/price-service'
import { Section } from '@/components/shared/section'
import { PriceWidget } from './price-widget'
import { GoldCalculator } from './gold-calculator'

export async function PriceSection() {
  // قیمت اولیه برای SSR — کلاینت با polling به‌روز می کند
  const price = await priceService.getCurrentPrice()

  return (
    <Section
      id="price"
      eyebrow="قیمت لحظه‌ای"
      title="قیمت طلا، شفاف و به‌روز"
      description="قیمت خرید و فروش طلای ۱۸ عیار را همیشه شفاف ببینید — بدون هزینه پنهان."
    >
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <PriceWidget initialPrice={price} />
        <GoldCalculator price={price} />
      </div>
    </Section>
  )
}
