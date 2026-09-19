// ============================================
// Zar30 - Features Section
// ============================================
// امکانات اصلی — ۶ کارت طبق MEGAPLAN
// Server Component
// ============================================

import { FEATURES } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'

export function Features() {
  return (
    <Section
      id="features"
      eyebrow="امکانات"
      title="هر آنچه برای طلا نیاز دارید"
      description="از خرید با هر مبلغی تا تحویل فیزیکی درب منزل — زرسی یک پلتفرم کامل طلای دیجیتال است."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="group border-border/60 hover:border-gold/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <CardContent className="p-6">
              <div className="bg-gold/15 group-hover:bg-gold/25 mb-4 flex size-12 items-center justify-center rounded-xl transition-colors">
                <feature.icon className="text-gold size-6" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
