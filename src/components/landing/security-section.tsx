// ============================================
// Zarnama - Security Section
// ============================================
// بخش امنیت — احراز هویت، رمزنگاری، Audit
// Server Component
// ============================================

import Link from 'next/link'
import { ShieldCheck, Fingerprint, FileSearch, KeyRound, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'

const SECURITY_ITEMS = [
  {
    icon: Fingerprint,
    title: 'احراز هویت چندسطحی',
    description: 'OTP پیامکی، رمز عبور قوی و احراز هویت دو مرحله‌ای (2FA) برای محافظت از حساب شما.',
  },
  {
    icon: KeyRound,
    title: 'رمزنگاری داده‌ها',
    description:
      'اطلاعات حساس با الگوریتم‌های استاندارد رمزنگاری می‌شوند — رمزها هرگز به‌صورت متن ساده ذخیره نمی‌شوند.',
  },
  {
    icon: FileSearch,
    title: 'دفتر کل قابل حسابرسی',
    description:
      'هر تراکنش مالی در دفتر کل دوطرفه ثبت می‌شود — هیچ تغییری بدون سند و ردپا انجام نمی‌شود.',
  },
  {
    icon: ShieldCheck,
    title: 'مدیریت نشست‌ها',
    description: 'نشست‌های فعال خود را ببینید و هر دستگاه ناشناس را فوراً لغو کنید.',
  },
]

export function SecuritySection() {
  return (
    <Section
      id="security"
      className="bg-muted/30"
      eyebrow="امنیت"
      title="امنیت، بخشی از معماری — نه یک افزونه"
      description="زرنما از ابتدا با استانداردهای FinTech طراحی شده است."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {SECURITY_ITEMS.map((item) => (
          <div
            key={item.title}
            className="border-border/60 bg-card flex gap-4 rounded-2xl border p-6"
          >
            <div className="bg-navy/10 dark:bg-gold/15 flex size-12 shrink-0 items-center justify-center rounded-xl">
              <item.icon className="text-navy dark:text-gold size-6" />
            </div>
            <div>
              <h3 className="text-foreground mb-1.5 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/security">
            بیشتر درباره امنیت زرنما
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>
    </Section>
  )
}
