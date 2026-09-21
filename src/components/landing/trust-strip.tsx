// ============================================
// Zar30 - Trust Strip / Marquee (Landing)
// ============================================
// نوار تکرارشونده نشان‌های اعتماد — حرکت خطی پیوسته،
// pause روی hover، در موبایل کندتر. فقط حقایق واقعی محصول.
// ============================================

import { BadgeCheck } from 'lucide-react'
import { TRUST_STRIP_ITEMS } from '@/lib/data/landing'

export function TrustStrip() {
  // دو نسخه از لیست برای حلقه بی‌درز marquee
  const items = [...TRUST_STRIP_ITEMS, ...TRUST_STRIP_ITEMS]
  return (
    <section
      className="border-navy-100/70 bg-cream-50 overflow-hidden border-y py-5"
      aria-label="نشان‌های اعتماد زرسی"
    >
      <div className="marquee-track flex w-max items-center gap-3" dir="rtl">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            aria-hidden={i >= TRUST_STRIP_ITEMS.length}
            className="border-navy-100/80 text-navy-700 inline-flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-[13px] font-medium whitespace-nowrap"
          >
            <BadgeCheck className="text-gold-500 size-4" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
