// ============================================
// Zarnama - Stats Section
// ============================================
// نوار آمار — کاربران، طلا، تراکنش‌ها
// Server Component
// ============================================

import { STATS } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'

export function Stats() {
  return (
    <section className="bg-navy-dark text-cream py-14" aria-label="آمار زرنما">
      <Container>
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className="text-gold mb-3 size-7" aria-hidden="true" />
              <dd className="text-gold text-2xl font-bold sm:text-3xl" dir="ltr">
                {stat.value}
              </dd>
              <dt className="text-cream/70 mt-1 text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
