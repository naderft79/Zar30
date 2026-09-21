// ============================================
// Zar30 - SEO Content Layer (Landing)
// ============================================
// لایه محتوای متنی برای موتورهای جست‌وجو —
// مینیمال، کاملاً semantic و crawlable؛
// نباید با Landing اصلی رقابت بصری کند
// ============================================

import { SEO_CONTENT } from '@/lib/data/landing'

export function SeoContent() {
  return (
    <section
      id="about-gold"
      className="border-navy-100/70 bg-cream-50 border-t py-14"
      aria-label="راهنمای خرید و سرمایه‌گذاری طلا"
    >
      <div className="text-navy-500 mx-auto max-w-[950px] px-4 sm:px-6">
        {SEO_CONTENT.map((block) => (
          <article key={block.heading} className="mb-8 last:mb-0">
            <h2 className="text-navy-800 mb-3 text-base font-semibold">{block.heading}</h2>
            {block.paragraphs.map((paragraph, i) => (
              <p key={i} className="mb-3 text-[15px] leading-[2] last:mb-0">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
