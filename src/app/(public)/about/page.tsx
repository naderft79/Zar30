// ============================================
// Zarnama - About Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Eye, Coins, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import { STATS } from '@/lib/data/landing'

export const metadata: Metadata = {
  title: 'درباره زرنما',
  description:
    'زرنما با ماموریت ساده‌سازی سرمایه‌گذاری روی طلا برای همه ساخته شده است — شفاف، امن و قابل حسابرسی.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <Section
        containerSize="md"
        eyebrow="درباره ما"
        titleAs="h1"
        title="زرنما؛ طلا برای همه"
        description="ما باور داریم سرمایه‌گذاری روی طلا نباید فقط برای افراد ثروتمند باشد."
      >
        <div className="prose-p:text-muted-foreground mx-auto max-w-3xl space-y-6 text-center">
          <p className="text-muted-foreground text-lg leading-relaxed">
            زرنما پلتفرمی برای خرید، فروش و نگهداری طلای آب‌شده ۱۸ عیار به‌صورت دیجیتال است. ماموریت
            ما این است که سرمایه‌گذاری روی طلا را برای همه — با هر بودجه‌ای — ساده، امن و شفاف کنیم.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            هر گرم طلای دیجیتال در زرنما متناظر با طلای فیزیکی نگهداری‌شده در خزانه است و تمام
            تراکنش‌ها در یک دفتر کل دوطرفه (Double-Entry Ledger) ثبت می‌شوند — دقیقاً همان
            استانداردی که سیستم‌های بانکی از آن استفاده می‌کنند.
          </p>
        </div>
      </Section>

      <Section className="bg-muted/30" title="ارزش‌های ما">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Eye,
              title: 'شفافیت',
              text: 'هر تراکنش سند دارد و قابل راستی‌آزمایی است. هیچ هزینه پنهانی وجود ندارد.',
            },
            {
              icon: ShieldCheck,
              title: 'امنیت',
              text: 'امنیت بخشی از معماری ماست — از احراز هویت چندسطحی تا رمزنگاری داده‌ها.',
            },
            {
              icon: Coins,
              title: 'دسترس‌پذیری',
              text: 'با هر مبلغی می‌توانید صاحب طلا شوید — حتی با کمترین بودجه.',
            },
          ].map((v) => (
            <div
              key={v.title}
              className="border-border/60 bg-card rounded-2xl border p-6 text-center"
            >
              <div className="bg-gold/15 mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
                <v.icon className="text-gold size-6" />
              </div>
              <h3 className="text-foreground mb-2 font-semibold">{v.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="زرنما در یک نگاه">
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="border-border/60 bg-card rounded-2xl border p-6 text-center"
            >
              <stat.icon className="text-gold mx-auto mb-3 size-7" />
              <dd className="text-gold text-2xl font-bold" dir="ltr">
                {stat.value}
              </dd>
              <dt className="text-muted-foreground mt-1 text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/register">
              به زرنما بپیوندید
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
