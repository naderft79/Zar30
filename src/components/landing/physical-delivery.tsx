// ============================================
// Zar30 - Physical Delivery Section (Landing)
// ============================================
// تحویل فیزیکی — متن + بولت‌ها + ویژوال طلا
// (مفهوم layout مطابق مرجع؛ محتوای واقعی زرسی)
// ============================================

import Link from 'next/link'
import { Package } from 'lucide-react'
import { DELIVERY_BULLETS } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'
import { FeatureBullet } from './feature-bullet'
import { GoldBarsVisual } from './gold-visuals'

export function PhysicalDelivery() {
  return (
    <section id="delivery" className="bg-white py-16 sm:py-20" aria-labelledby="delivery-title">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* متن */}
          <Reveal>
            <div>
              <p className="text-gold-600 mb-2 inline-flex items-center gap-1.5 text-sm font-semibold">
                <Package className="size-4" aria-hidden="true" />
                تحویل فیزیکی
              </p>
              <h2
                id="delivery-title"
                className="text-navy-950 text-2xl leading-snug font-bold text-balance sm:text-3xl"
              >
                طلای دیجیتال خود را، در دستان خود بگیرید
              </h2>
              <p className="text-navy-500 mt-4 text-[15px] leading-8 text-pretty">
                هر زمان که بخواهید، طلای کیف پول خود را به‌صورت فیزیکی تحویل بگیرید. از ثبت درخواست
                تا تحویل درب منزل، کل مسیر شفاف و قابل پیگیری است.
              </p>
              <ul className="mt-6 space-y-3.5">
                {DELIVERY_BULLETS.map((bullet) => (
                  <FeatureBullet key={bullet.text} {...bullet} />
                ))}
              </ul>
              <Link
                href="/register"
                className="border-navy-200 text-navy-800 hover:border-navy-300 hover:bg-cream-50 mt-8 inline-flex h-11 items-center rounded-xl border px-6 text-sm font-semibold transition-colors active:scale-[0.98]"
              >
                ثبت درخواست تحویل
              </Link>
            </div>
          </Reveal>

          {/* ویژوال */}
          <Reveal delay={100}>
            <div className="bg-cream-50 border-navy-100/60 relative overflow-hidden rounded-3xl border p-6 sm:p-10">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_220px_at_70%_10%,rgb(201_162_39/0.08),transparent_70%)]"
                aria-hidden="true"
              />
              <GoldBarsVisual className="relative mx-auto max-w-[400px]" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
