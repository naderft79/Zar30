// ============================================
// Zarnama - Security Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  FileSearch,
  Server,
  Lock,
  ArrowLeft,
} from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'امنیت',
  description:
    'امنیت در زرنما بخشی از معماری است: احراز هویت چندسطحی، رمزنگاری، دفتر کل دوطرفه و زیرساخت قابل حسابرسی.',
  alternates: { canonical: '/security' },
}

const LAYERS = [
  {
    icon: Fingerprint,
    title: 'احراز هویت چندلایه',
    items: [
      'ورود با کد یکبارمصرف (OTP) پیامکی',
      'رمز عبور قوی با استاندارد bcrypt',
      'احراز هویت دو مرحله‌ای (2FA) اختیاری',
      'تشخیص و مسدودسازی تلاش‌های مشکوک',
    ],
  },
  {
    icon: KeyRound,
    title: 'رمزنگاری داده‌ها',
    items: [
      'رمزنگاری داده‌های حساس در حالت سکون و انتقال',
      'رمزها هرگز به‌صورت متن ساده ذخیره نمی‌شوند',
      'کلیدها و توکن‌ها در HttpOnly Cookie نگهداری می‌شوند',
      'عدم نمایش اطلاعات حساس در لاگ‌ها',
    ],
  },
  {
    icon: FileSearch,
    title: 'یکپارچگی مالی',
    items: [
      'دفتر کل دوطرفه (Double-Entry) برای همه تراکنش‌ها',
      'Idempotency برای جلوگیری از تراکنش تکراری',
      'ثبت Audit Log برای عملیات حساس',
      'تراز خودکار بدهکار/بستانکار در هر سند',
    ],
  },
  {
    icon: Server,
    title: 'زیرساخت',
    items: [
      'PostgreSQL به‌عنوان مرجع نهایی صحت مالی',
      'تراکنش‌های پایگاه داده با قفل سطری',
      'بکاپ‌گیری منظم (در استقرار Production)',
      'مانیتورینگ و هشداردهی (در استقرار Production)',
    ],
  },
]

const TIPS = [
  'رمز عبور قوی و منحصربه‌فرد انتخاب کنید',
  'احراز هویت دو مرحله‌ای را فعال کنید',
  'نشست‌های فعال خود را به‌صورت دوره‌ای بررسی کنید',
  'کد تایید را با هیچ‌کس — حتی پشتیبانی — به اشتراک نگذارید',
]

export default function SecurityPage() {
  return (
    <>
      <Section
        containerSize="md"
        eyebrow="امنیت"
        titleAs="h1"
        title="امنیت در زرنما"
        description="امنیت برای ما یک قابلیت نیست — بخشی از معماری است."
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-gold/15 mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl">
            <ShieldCheck className="text-gold size-8" />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            زرنما از ابتدا با استانداردهای FinTech طراحی شده است. در ادامه لایه‌های امنیتی پلتفرم را
            می‌بینید — از احراز هویت کاربر تا یکپارچگی دفتر کل مالی.
          </p>
        </div>
      </Section>

      <Section className="bg-muted/30" title="لایه‌های امنیتی">
        <div className="grid gap-6 sm:grid-cols-2">
          {LAYERS.map((layer) => (
            <div key={layer.title} className="border-border/60 bg-card rounded-2xl border p-6">
              <div className="bg-gold/15 mb-4 flex size-12 items-center justify-center rounded-xl">
                <layer.icon className="text-gold size-6" />
              </div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">{layer.title}</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                {layer.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Lock className="text-gold mt-0.5 size-3.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section containerSize="md" title="امنیت حساب شما">
        <div className="border-border/60 bg-card mx-auto max-w-2xl rounded-2xl border p-6 sm:p-8">
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            برای حفاظت بیشتر از حساب خود این نکات را رعایت کنید:
          </p>
          <ul className="space-y-3">
            {TIPS.map((tip) => (
              <li key={tip} className="text-foreground flex items-start gap-3 text-sm">
                <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" asChild>
            <Link href="/register">
              حساب امن خود را بسازید
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
