// ============================================
// Zar30 - Referral Section
// ============================================
// معرفی سیستم دعوت — فقط UX و معرفی Feature
// ============================================

import Link from 'next/link'
import { Gift, Users, Share2, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'

const REFERRAL_STEPS = [
  { icon: Share2, title: 'لینک دعوت خود را بفرستید' },
  { icon: Users, title: 'دوستان شما ثبت‌نام کنند' },
  { icon: Gift, title: 'هر دو طرف پاداش بگیرید' },
]

export function ReferralSection() {
  return (
    <Section
      id="referral"
      className="from-navy-dark to-navy text-cream bg-gradient-to-b"
      eyebrow="دعوت از دوستان"
      title="زرسی را معرفی کنید، هر دو سود کنید"
      description="با لینک دعوت اختصاصی خود، دوستانتان را به زرسی دعوت کنید."
    >
      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
        {REFERRAL_STEPS.map((step, index) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            {index < REFERRAL_STEPS.length - 1 && (
              <div
                className="border-gold/30 absolute top-7 -left-1/3 hidden w-2/3 border-t-2 border-dashed sm:block"
                aria-hidden="true"
              />
            )}
            <div className="bg-gold/15 border-gold/40 relative z-10 mb-4 flex size-14 items-center justify-center rounded-full border-2">
              <step.icon className="text-gold size-6" />
            </div>
            <p className="text-cream font-medium">{step.title}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button
          size="lg"
          className="bg-gold text-navy-dark hover:bg-gold-light font-semibold"
          asChild
        >
          <Link href="/register">
            دریافت لینک دعوت
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-cream/50 mt-4 text-xs">
          جزئیات و میزان پاداش در پنل کاربری شما نمایش داده می‌شود.
        </p>
      </div>
    </Section>
  )
}
