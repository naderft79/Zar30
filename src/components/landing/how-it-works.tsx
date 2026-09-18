// ============================================
// Zarnama - How It Works Section
// ============================================
// سفر کاربر: ثبت‌نام → احراز هویت → شارژ → خرید → مدیریت
// Server Component
// ============================================

import { HOW_IT_WORKS } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="نحوه کار"
      title="در پنج قدم، صاحب طلا شوید"
      description="از ثبت‌نام تا مدیریت دارایی — مسیر ساده و شفاف است."
    >
      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5" role="list">
        {HOW_IT_WORKS.map((step, index) => (
          <li key={step.title} className="relative flex flex-col items-center text-center">
            {/* خط اتصال — فقط دسکتاپ */}
            {index < HOW_IT_WORKS.length - 1 && (
              <div
                className="border-gold/30 absolute top-7 -left-1/2 hidden w-full border-t-2 border-dashed lg:block"
                aria-hidden="true"
              />
            )}
            <div className="bg-gold/15 border-gold/40 relative z-10 mb-4 flex size-14 items-center justify-center rounded-full border-2">
              <step.icon className="text-gold size-6" />
            </div>
            <span className="text-gold mb-1 text-xs font-bold" aria-hidden="true">
              مرحله {index + 1}
            </span>
            <h3 className="text-foreground mb-2 font-semibold">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
