// ============================================
// Zar30 - Final CTA (Landing)
// ============================================
// CTA پایانی — سرمه‌ای تیره + طلایی؛ محتوای fade-up
// بدون particle/neon/3D — فقط هاله radial بسیار ملایم
// ============================================

import Link from 'next/link'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'

export function FinalCta() {
  return (
    <section
      className="from-navy-900 to-navy-950 bg-gradient-to-b py-20 sm:py-24"
      aria-labelledby="final-cta-title"
    >
      <Container size="md">
        <Reveal>
          <div className="relative text-center">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_280px_at_50%_0%,rgb(201_162_39/0.12),transparent_70%)]"
              aria-hidden="true"
            />
            <p className="text-gold-300/90 relative mb-3 text-sm font-semibold">
              آماده شروع هستید؟
            </p>
            <h2
              id="final-cta-title"
              className="text-cream-50 relative text-2xl leading-snug font-bold text-balance sm:text-3xl lg:text-4xl"
            >
              همین امروز اولین طلای خود را بخرید
            </h2>
            <p className="text-navy-200/90 relative mx-auto mt-4 max-w-lg text-[15px] leading-8 text-pretty">
              با هر مبلغی شروع کنید؛ بدون اجرت ساخت، با شفافیت کامل قیمت و کارمزد.
            </p>
            <Link
              href="/register"
              className="bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold relative mt-8 inline-flex h-12 items-center rounded-xl px-8 text-[15px] font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              شروع سرمایه‌گذاری در طلا
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
