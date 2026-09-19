// ============================================
// Zar30 - Investment Preview Section
// ============================================
// معرفی طرح‌های سرمایه‌گذاری طلا — فقط Presentation
// هیچ محاسبه سود واقعی انجام نمی شود
// ============================================

import Link from 'next/link'
import { TrendingUp, Clock, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const PREVIEW_PLANS = [
  {
    icon: Clock,
    title: 'طرح کوتاه‌مدت',
    period: 'از ۳۰ روز',
    description: 'برای شروع سرمایه‌گذاری طلایی با انعطاف بالا',
    tag: 'انعطاف‌پذیر',
  },
  {
    icon: TrendingUp,
    title: 'طرح میان‌مدت',
    period: 'از ۹۰ روز',
    description: 'تعادل بین بازده و دسترسی به دارایی',
    tag: 'محبوب',
  },
  {
    icon: ShieldCheck,
    title: 'طرح بلندمدت',
    period: 'از ۱۸۰ روز',
    description: 'برای ساخت دارایی طلایی پایدار در بلندمدت',
    tag: 'پایدار',
  },
]

export function InvestmentPreview() {
  return (
    <Section
      id="investment"
      className="bg-navy-dark text-cream"
      eyebrow="سرمایه‌گذاری"
      title="طرح‌های سرمایه‌گذاری طلا"
      description="طلای خود را در طرح‌های سوددهی قرار دهید. جزئیات و شرایط هر طرح قبل از ثبت‌نام به‌صورت شفاف نمایش داده می‌شود."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PREVIEW_PLANS.map((plan) => (
          <Card
            key={plan.title}
            className="bg-navy/50 border-cream/10 hover:border-gold/40 transition-colors"
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="bg-gold/15 flex size-12 items-center justify-center rounded-xl">
                  <plan.icon className="text-gold size-6" />
                </div>
                <Badge variant="outline" className="border-gold/40 text-gold text-xs">
                  {plan.tag}
                </Badge>
              </div>
              <h3 className="text-cream text-lg font-semibold">{plan.title}</h3>
              <p className="text-gold mt-1 text-sm font-medium">{plan.period}</p>
              <p className="text-cream/60 mt-2 text-sm leading-relaxed">{plan.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button
          size="lg"
          variant="outline"
          className="border-gold/50 text-gold hover:bg-gold hover:text-navy-dark"
          asChild
        >
          <Link href="/register">
            مشاهده طرح‌ها پس از ثبت‌نام
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-cream/50 mt-4 text-xs">
          سرمایه‌گذاری همراه با ریسک است. بازده گذشته تضمینی برای آینده نیست.
        </p>
      </div>
    </Section>
  )
}
