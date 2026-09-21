// ============================================
// Zar30 - Feature Section (Landing, Gerami-style)
// ============================================
// دو ستون: متن (heading/desc/bullets/CTA) + ویژوال طلایی
// موبایل: stack — reveal هنگام ورود به viewport
// ============================================

import Link from 'next/link'
import type { FeatureSectionData } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'
import { FeatureBullet } from './feature-bullet'
import { GoldVisual } from './gold-visuals'
import { cn } from 'cn'

export function FeatureSection({ data }: { data: FeatureSectionData }) {
  return (
    <section id={data.id} className="bg-white py-16 sm:py-20" aria-labelledby={`${data.id}-title`}>
      <Container>
        <div
          className={cn(
            'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
            data.reverse && 'lg:[&>*:first-child]:order-2',
          )}
        >
          {/* متن */}
          <Reveal>
            <div>
              <p className="text-gold-600 mb-2 text-sm font-semibold">{data.eyebrow}</p>
              <h2
                id={`${data.id}-title`}
                className="text-navy-950 text-2xl leading-snug font-bold text-balance sm:text-3xl"
              >
                {data.title}
              </h2>
              <p className="text-navy-500 mt-4 text-[15px] leading-8 text-pretty">
                {data.description}
              </p>
              <ul className="mt-6 space-y-3.5">
                {data.bullets.map((bullet) => (
                  <FeatureBullet key={bullet.text} {...bullet} />
                ))}
              </ul>
              <Link
                href={data.cta.href}
                className="bg-navy-900 text-cream-50 hover:bg-navy-800 mt-8 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold transition-colors active:scale-[0.98]"
              >
                {data.cta.label}
              </Link>
            </div>
          </Reveal>

          {/* ویژوال */}
          <Reveal delay={100}>
            <div className="bg-cream-50 border-navy-100/60 relative overflow-hidden rounded-3xl border p-6 sm:p-10">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_220px_at_30%_10%,rgb(201_162_39/0.08),transparent_70%)]"
                aria-hidden="true"
              />
              <GoldVisual variant={data.visual} className="relative mx-auto max-w-[400px]" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
