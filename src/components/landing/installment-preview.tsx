// ============================================
// Zar30 - Installment Preview Section
// ============================================
// معرفی خرید اقساطی طلا — فقط Presentation/UX
// قوانین مالی در Phaseهای بعدی پیاده‌سازی می شوند
// ============================================

import Link from 'next/link'
import { CalendarClock, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STEPS = [
  'طرح اقساطی مناسب خود را انتخاب کنید',
  'پیش‌پرداخت را بپردازید',
  'اقساط ماهانه را پرداخت کنید',
  'پس از تسویه، طلا مال شماست',
]

export function InstallmentPreview() {
  return (
    <Section
      id="installment"
      eyebrow="خرید اقساطی"
      title="طلا بخرید، قسطی بپردازید"
      description="بدون نیاز به پرداخت یکجا، طلای دلخواه خود را به‌صورت اقساطی تهیه کنید."
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* متن و مراحل */}
        <div>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-start gap-3">
                <span className="bg-gold/15 border-gold/40 text-gold flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-foreground font-medium">{step}</p>
                </div>
              </div>
            ))}
          </div>
          <ul className="text-muted-foreground mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4 shrink-0" />
              بدون چک و سفته
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4 shrink-0" />
              شرایط شفاف قبل از ثبت‌نام
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4 shrink-0" />
              امکان تحویل فیزیکی پس از تسویه
            </li>
          </ul>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              شروع خرید اقساطی
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        {/* کارت نمایشی */}
        <Card className="border-gold/30 from-card to-gold/5 overflow-hidden bg-gradient-to-br">
          <CardContent className="p-8">
            <div className="bg-gold/15 mb-6 flex size-14 items-center justify-center rounded-2xl">
              <CalendarClock className="text-gold size-7" />
            </div>
            <h3 className="text-foreground text-xl font-bold">اقساط منعطف</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              طرح‌های ۶ تا ۲۴ ماهه با پیش‌پرداخت متغیر — متناسب با بودجه شما.
            </p>
            <div className="border-border mt-6 space-y-3 border-t pt-6">
              {[
                { label: 'پیش‌پرداخت', value: 'از ۲۰٪' },
                { label: 'تعداد اقساط', value: '۶ تا ۲۴ ماه' },
                { label: 'مالکیت طلا', value: 'پس از تسویه کامل' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-foreground font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
              نرخ‌ها و شرایط دقیق در زمان ثبت درخواست و قبل از پرداخت نمایش داده می‌شود.
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
