// ============================================
// Zarnama - CTA Section
// ============================================
// دعوت نهایی به اقدام — شروع کار / ثبت‌نام / ورود
// Server Component
// ============================================

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/shared/container'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20" aria-labelledby="cta-title">
      <div
        className="from-gold-dark via-gold to-gold-dark absolute inset-0 bg-gradient-to-l"
        aria-hidden="true"
      />
      <Container className="relative text-center">
        <h2 id="cta-title" className="text-navy-dark text-2xl font-bold sm:text-3xl lg:text-4xl">
          همین امروز صاحب طلا شوید
        </h2>
        <p className="text-navy-dark/80 mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
          با هر مبلغی شروع کنید — ثبت‌نام کمتر از یک دقیقه طول می‌کشد.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="bg-navy-dark text-gold hover:bg-navy h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link href="/register">
              ایجاد حساب رایگان
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-navy-dark/40 text-navy-dark hover:bg-navy-dark/10 h-12 px-8 text-base"
            asChild
          >
            <Link href="/login">ورود به حساب</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
