// ============================================
// Zarnama - Hero Section
// ============================================
// بخش اصلی Landing — headline + CTA + visual طلایی
// Visual با SVG ساخته شده (بدون تصویر stock)
// ============================================

import Link from 'next/link'
import { ArrowDown, ShieldCheck, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/shared/container'

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* پس‌زمینه گرادیانت navy با درخشش طلایی */}
      <div
        className="from-navy-dark via-navy to-navy-dark absolute inset-0 bg-gradient-to-b"
        aria-hidden="true"
      />
      <div
        className="bg-gold/10 absolute -top-40 right-1/4 size-96 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-gold/5 absolute bottom-0 left-1/4 size-72 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          {/* متن */}
          <div className="text-center lg:text-right">
            <Badge
              variant="outline"
              className="border-gold/40 text-gold mb-6 inline-flex items-center gap-1.5 px-3 py-1"
            >
              <ShieldCheck className="size-3.5" />
              پشتوانه طلای فیزیکی — قابل حسابرسی
            </Badge>

            <h1
              id="hero-title"
              className="text-cream text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl xl:text-6xl"
            >
              طلای آب‌شده،
              <br />
              <span className="from-gold-light via-gold to-gold-dark bg-gradient-to-l bg-clip-text text-transparent">
                به سادگی چند کلیک
              </span>
            </h1>

            <p className="text-cream/70 mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0">
              زرنما امن‌ترین راه برای خرید، فروش و نگهداری طلای ۱۸ عیار است. با هر مبلغی شروع کنید —
              بدون اجرت ساخت، بدون واسطه، با شفافیت کامل.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-gold text-navy-dark hover:bg-gold-light h-12 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/register">شروع سرمایه‌گذاری</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cream/30 text-cream hover:bg-cream/10 hover:text-cream h-12 px-8 text-base"
                asChild
              >
                <Link href="#how-it-works">
                  نحوه کار
                  <ArrowDown className="size-4" />
                </Link>
              </Button>
            </div>

            {/* آمار کوچک */}
            <dl className="border-cream/10 mt-10 flex items-center justify-center gap-8 border-t pt-6 lg:justify-start">
              <div>
                <dt className="text-cream/50 text-xs">کاربران</dt>
                <dd className="text-gold text-lg font-bold">+۵۰٬۰۰۰</dd>
              </div>
              <div>
                <dt className="text-cream/50 text-xs">طلای تحت مدیریت</dt>
                <dd className="text-gold text-lg font-bold">+۱۲۰ کیلوگرم</dd>
              </div>
              <div>
                <dt className="text-cream/50 text-xs">پشتوانه فیزیکی</dt>
                <dd className="text-gold text-lg font-bold">۱۰۰٪</dd>
              </div>
            </dl>
          </div>

          {/* Visual طلایی */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  )
}

// ============================================
// HeroVisual — شمش‌های طلای SVG
// ============================================
function HeroVisual() {
  return (
    <div className="relative">
      {/* حلقه نورانی */}
      <div className="border-gold/20 absolute inset-0 -z-10 scale-110 rounded-full border" />
      <svg
        viewBox="0 0 400 340"
        fill="none"
        className="w-full drop-shadow-2xl"
        role="img"
        aria-label="شمش‌های طلا"
      >
        <defs>
          <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d48a" />
            <stop offset="45%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#8a6d15" />
          </linearGradient>
          <linearGradient id="goldBarTop" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#f5e6ac" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="goldBarSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a0801c" />
            <stop offset="100%" stopColor="#6b5510" />
          </linearGradient>
        </defs>

        {/* شمش پایین راست */}
        <g transform="translate(150 180)">
          <polygon points="40,60 190,60 170,20 60,20" fill="url(#goldBarTop)" />
          <polygon points="40,60 190,60 190,110 40,110" fill="url(#goldBar)" />
          <polygon points="190,60 170,20 170,70 190,110" fill="url(#goldBarSide)" />
          <text x="115" y="95" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#4a3a08">
            999.9
          </text>
        </g>

        {/* شمش وسط */}
        <g transform="translate(80 120)">
          <polygon points="40,60 190,60 170,20 60,20" fill="url(#goldBarTop)" />
          <polygon points="40,60 190,60 190,110 40,110" fill="url(#goldBar)" />
          <polygon points="190,60 170,20 170,70 190,110" fill="url(#goldBarSide)" />
          <text x="115" y="95" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#4a3a08">
            ZARNAMA
          </text>
        </g>

        {/* شمش بالا چپ */}
        <g transform="translate(30 55)">
          <polygon points="40,60 190,60 170,20 60,20" fill="url(#goldBarTop)" />
          <polygon points="40,60 190,60 190,110 40,110" fill="url(#goldBar)" />
          <polygon points="190,60 170,20 170,70 190,110" fill="url(#goldBarSide)" />
          <text x="115" y="95" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#4a3a08">
            ۱۸ عیار
          </text>
        </g>

        {/* سکه معلق */}
        <g transform="translate(320 60)">
          <circle cx="30" cy="30" r="28" fill="url(#goldBar)" />
          <circle
            cx="30"
            cy="30"
            r="22"
            fill="none"
            stroke="#4a3a08"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <text x="30" y="36" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#4a3a08">
            ز
          </text>
        </g>
      </svg>

      {/* کارت قیمت شناور */}
      <div className="bg-card/90 border-gold/30 animate-float absolute right-4 -bottom-4 flex items-center gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-sm sm:right-8 sm:-bottom-2">
        <div className="bg-gold/20 flex size-10 items-center justify-center rounded-lg">
          <TrendingUp className="text-gold size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">طلای ۱۸ عیار</p>
          <p className="text-foreground text-sm font-bold">هر گرم، هر لحظه</p>
        </div>
      </div>
    </div>
  )
}
