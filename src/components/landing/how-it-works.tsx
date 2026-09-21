// ============================================
// Zar30 - How It Works (Landing)
// ============================================
// مراحل شماره‌گذاری‌شده Gerami-style — دسکتاپ افقی، موبایل عمودی
// ورود پلکانی ۰/۸۰/۱۶۰/۲۴۰ms هنگام ورود به viewport
// ============================================

import { HOW_IT_WORKS_STEPS } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-50 py-16 sm:py-20" aria-labelledby="how-title">
      <Container>
        <div className="mb-10 text-center sm:mb-12">
          <p className="text-gold-600 mb-2 text-sm font-semibold">شروع سریع</p>
          <h2 id="how-title" className="text-navy-950 text-2xl font-bold sm:text-3xl">
            در چهار قدم شروع کنید
          </h2>
          <p className="text-navy-500 mx-auto mt-3 max-w-lg text-sm leading-7 sm:text-[15px]">
            از ثبت‌نام تا مدیریت دارایی، کل مسیر کمتر از چند دقیقه طول می‌کشد.
          </p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 80} className="h-full">
              <article className="group border-navy-100/90 relative h-full rounded-2xl border bg-white p-5 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_14px_32px_-12px_rgb(16_29_56/0.14)]">
                {/* شماره */}
                <span
                  className="text-gold-600/90 text-3xl leading-none font-extrabold tabular-nums select-none"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="bg-cream-100 text-gold-600 absolute top-5 left-5 inline-flex size-10 items-center justify-center rounded-xl transition-transform duration-250 group-hover:scale-[1.04]">
                  <step.icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="text-navy-950 mt-4 text-[15px] font-bold">{step.title}</h3>
                <p className="text-navy-500 mt-2 text-[13px] leading-6 text-pretty">
                  {step.description}
                </p>
              </article>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}
