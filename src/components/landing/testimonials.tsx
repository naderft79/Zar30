// ============================================
// Zarnama - Testimonials Section
// ============================================
// نظرات کاربران — اسکرول افقی با scroll-snap (بدون وابستگی جدید)
// Server Component — بدون JavaScript سمت کلاینت
// ============================================

import { Quote } from 'lucide-react'
import { TESTIMONIALS } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'

export function Testimonials() {
  return (
    <Section
      id="testimonials"
      eyebrow="نظرات کاربران"
      title="آن‌ها که زرنما را انتخاب کردند"
      description="تجربه کاربران واقعی پلتفرم زرنما"
    >
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        role="list"
      >
        {TESTIMONIALS.map((t) => (
          <Card
            key={t.name}
            role="listitem"
            className="border-border/60 w-72 shrink-0 snap-center sm:w-auto"
          >
            <CardContent className="flex h-full flex-col p-6">
              <Quote className="text-gold mb-4 size-6" aria-hidden="true" />
              <p className="text-foreground flex-1 text-sm leading-relaxed">{t.text}</p>
              <footer className="border-border mt-5 border-t pt-4">
                <p className="text-foreground text-sm font-semibold">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.role}</p>
              </footer>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
