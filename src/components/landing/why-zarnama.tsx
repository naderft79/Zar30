// ============================================
// Zarnama - Why ZarNama Section
// ============================================
// مزایای کلیدی — اعتماد، امنیت، شفافیت
// Server Component
// ============================================

import { WHY_ZARNAMA } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'

export function WhyZarnama() {
  return (
    <Section
      id="why-zarnama"
      className="bg-muted/30"
      eyebrow="چرا زرنما"
      title="اعتماد، با سند و مدرک"
      description="در زرنما هر گرم طلا سند دارد — نه شعار، بلکه معماری قابل حسابرسی."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_ZARNAMA.map((item, index) => (
          <div
            key={item.title}
            className="border-border/60 bg-card relative overflow-hidden rounded-2xl border p-6"
          >
            {/* شماره بزرگ پس‌زمینه */}
            <span
              className="text-gold/10 absolute -top-3 left-3 text-6xl font-bold select-none"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="bg-navy/10 dark:bg-gold/15 mb-4 flex size-12 items-center justify-center rounded-xl">
              <item.icon className="text-navy dark:text-gold size-6" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
