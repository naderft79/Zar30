// ============================================
// Zar30 - Support Section (Landing)
// ============================================
// ویژوال + عنوان + توضیح + تماس + CTA —
// فقط سرویس‌های واقعی پروژه (تماس/ایمیل)
// ============================================

import Link from 'next/link'
import { Headset, Mail, Phone } from 'lucide-react'
import { CONTACT_INFO } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'

export function SupportSection() {
  return (
    <section id="support" className="bg-cream-50 py-16 sm:py-20" aria-labelledby="support-title">
      <Container>
        <Reveal>
          <div className="from-navy-900 to-navy-950 border-navy-700/40 relative overflow-hidden rounded-3xl bg-gradient-to-l p-8 sm:p-12">
            {/* هاله طلایی بسیار ملایم */}
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_260px_at_85%_0%,rgb(201_162_39/0.14),transparent_70%)]"
              aria-hidden="true"
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-gold-300 mb-3 inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Headset className="size-4" aria-hidden="true" />
                  پشتیبانی زرسی
                </p>
                <h2
                  id="support-title"
                  className="text-cream-50 text-2xl leading-snug font-bold text-balance sm:text-3xl"
                >
                  هر سوالی دارید، کنار شما هستیم
                </h2>
                <p className="text-navy-200/90 mt-4 max-w-xl text-[15px] leading-8 text-pretty">
                  تیم پشتیبانی زرسی در ساعات کاری پاسخگوی شماست. از طریق تیکت پنل کاربری یا تماس
                  مستقیم با ما در ارتباط باشید.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <a
                    href={CONTACT_INFO.phoneHref}
                    className="text-cream-100 hover:text-gold-300 inline-flex items-center gap-2 font-semibold transition-colors"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    <span className="tabular-nums">{CONTACT_INFO.phone}</span>
                  </a>
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="text-cream-100 hover:text-gold-300 inline-flex items-center gap-2 transition-colors"
                    dir="ltr"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>

              <Link
                href="/contact"
                className="bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold inline-flex h-12 items-center justify-center rounded-xl px-7 text-[15px] font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98] lg:justify-self-end"
              >
                ارتباط با پشتیبانی
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
