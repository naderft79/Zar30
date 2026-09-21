// ============================================
// Zar30 - Trust Cards (Landing)
// ============================================
// کارت‌های اعتماد Gerami-style — سفید، border ظریف،
// hover: translateY(-3px) + shadow ملایم‌تر
// ============================================

import { TRUST_CARDS } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'

export function TrustCards() {
  return (
    <section className="bg-white py-14 sm:py-16" aria-label="ویژگی‌های کلیدی زرسی">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {TRUST_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 80}>
              <article className="group border-navy-100/90 h-full rounded-2xl border bg-white p-5 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_14px_32px_-12px_rgb(16_29_56/0.14)]">
                <span className="bg-cream-100 text-gold-600 inline-flex size-11 items-center justify-center rounded-xl transition-transform duration-250 group-hover:scale-[1.04]">
                  <card.icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="text-navy-950 mt-4 text-[15px] font-bold">{card.title}</h3>
                <p className="text-navy-500 mt-2 text-[13px] leading-6 text-pretty">
                  {card.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
