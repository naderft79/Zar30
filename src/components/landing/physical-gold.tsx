// ============================================
// Zarnama - Physical Gold Delivery Section
// ============================================
// معرفی تحویل فیزیکی طلا — فقط Presentation
// Order Flow واقعی در Phaseهای بعدی
// ============================================

import { Package, ShieldCheck, Truck, BadgeCheck } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'

const DELIVERY_POINTS = [
  {
    icon: Package,
    title: 'بسته‌بندی امن',
    description: 'شمش و سکه با بسته‌بندی مهروموم‌شده و استاندارد ارسال می‌شود.',
  },
  {
    icon: Truck,
    title: 'ارسال بیمه‌شده',
    description: 'کل مراحل ارسال تحت پوشش بیمه است تا خیال شما راحت باشد.',
  },
  {
    icon: BadgeCheck,
    title: 'عیار تضمین‌شده',
    description: 'طلای تحویلی ۱۸ عیار با شناسنامه و فاکتور رسمی است.',
  },
  {
    icon: ShieldCheck,
    title: 'احراز قبل از تحویل',
    description: 'تحویل فیزیکی فقط پس از تکمیل احراز هویت کامل انجام می‌شود.',
  },
]

export function PhysicalGold() {
  return (
    <Section
      id="delivery"
      eyebrow="تحویل فیزیکی"
      title="طلای دیجیتال، در دستان شما"
      description="هر زمان بخواهید، طلای حساب خود را به‌صورت فیزیکی و بیمه‌شده تحویل بگیرید."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERY_POINTS.map((item) => (
          <Card key={item.title} className="border-border/60">
            <CardContent className="p-6 text-center">
              <div className="bg-gold/15 mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
                <item.icon className="text-gold size-6" />
              </div>
              <h3 className="text-foreground mb-2 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed">
        شرایط، هزینه ارسال و حداقل مقدار تحویل در زمان ثبت درخواست و قبل از پرداخت به‌صورت شفاف
        اعلام می‌شود.
      </p>
    </Section>
  )
}
