// ============================================
// Zar30 - License / Trust Section (Landing)
// ============================================
// بخش اعتماد نزدیک انتهای صفحه — عنوان + نشان‌ها + CTA
// فقط حقایق واقعی محصول؛ مجوزهای رسمی پس از اخذ منتشر می‌شوند
// (هیچ لوگو یا نماد مجوز ساختگی نمایش داده نمی‌شود)
// ============================================

import Link from 'next/link'
import { FOOTER_BADGES } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'

export function LicenseSection() {
  return (
    <section id="trust" className="bg-white py-16 sm:py-20" aria-labelledby="trust-title">
      <Container size="md">
        <Reveal>
          <div className="text-center">
            <h2
              id="trust-title"
              className="text-navy-950 text-2xl font-bold text-balance sm:text-3xl"
            >
              اعتماد شما، مهم‌ترین دارایی ماست.
            </h2>
            <p className="text-navy-500 mx-auto mt-4 max-w-xl text-sm leading-8 text-pretty sm:text-[15px]">
              معماری مالی زرسی از روز اول برای اعتماد ساخته شده است: دفتر کل دوطرفه، پشتوانه طلای
              فیزیکی و ثبت کامل هر تصمیم و تراکنش.
            </p>

            {/* نشان‌های واقعی اعتماد */}
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {FOOTER_BADGES.map((badge) => (
                <li
                  key={badge.label}
                  className="border-navy-100/90 bg-cream-50 text-navy-700 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium"
                >
                  <badge.icon className="text-gold-500 size-4" aria-hidden="true" />
                  {badge.label}
                </li>
              ))}
            </ul>

            <p className="text-navy-400 mx-auto mt-6 max-w-md text-xs leading-6">
              مجوزها و نمادهای رسمی پس از اخذ، در همین بخش و صفحه قوانین منتشر می‌شوند.
            </p>

            <Link
              href="/terms"
              className="border-navy-200 text-navy-800 hover:border-navy-300 hover:bg-cream-50 mt-8 inline-flex h-11 items-center rounded-xl border px-6 text-sm font-semibold transition-colors active:scale-[0.98]"
            >
              مشاهده قوانین و مجوزها
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
