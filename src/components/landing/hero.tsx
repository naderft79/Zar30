// ============================================
// Zar30 - Hero Section (Gerami-style)
// ============================================
// دو ستون: متن (eyebrow/H1/desc/CTA) + ویژوال (کارت قیمت + طلا)
// ورود پلکانی زیر ۹۰۰ms — eyebrow → H1 → desc → CTA → قیمت → ویژوال
// ============================================

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import type { GoldPrice } from '@/lib/price/types'
import { Container } from '@/components/shared/container'
import { LiveGoldPriceCard } from './live-price-card'
import { GoldBarsVisual } from './gold-visuals'

export function Hero({ price }: { price: GoldPrice }) {
  return (
    <section
      className="via-cream-50 relative overflow-hidden from-white to-white"
      aria-labelledby="hero-title"
    >
      {/* بافت پس‌زمینه بسیار ظریف — نه glow شدید */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_0%,rgb(201_162_39/0.06),transparent_65%)]"
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:py-24">
          {/* ===== متن ===== */}
          <div className="text-center lg:text-right">
            <p
              className="border-gold-500/30 bg-gold-100/60 text-gold-700 hero-enter mx-auto inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold lg:mx-0"
              style={{ '--hero-delay': '0ms' } as React.CSSProperties}
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              پشتوانه طلای فیزیکی — قابل حسابرسی
            </p>

            <h1
              id="hero-title"
              className="text-navy-950 hero-enter mt-5 text-3xl leading-[1.25] font-extrabold text-balance sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
              style={{ '--hero-delay': '60ms' } as React.CSSProperties}
            >
              طلای آب‌شده ۱۸ عیار،
              <br />
              <span className="text-gold-600">با هر مبلغی، در چند کلیک</span>
            </h1>

            <p
              className="text-navy-600 hero-enter mx-auto mt-5 max-w-xl text-[15px] leading-8 text-pretty sm:text-base lg:mx-0"
              style={{ '--hero-delay': '120ms' } as React.CSSProperties}
            >
              زرسی پلتفرم خرید، فروش و نگهداری طلاست. بدون اجرت ساخت، بدون واسطه؛ با شفافیت کامل
              قیمت و کارمزد پیش از هر تراکنش.
            </p>

            <div
              className="hero-enter mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
              style={{ '--hero-delay': '180ms' } as React.CSSProperties}
            >
              <Link
                href="/register"
                className="bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold inline-flex h-12 items-center justify-center rounded-xl px-7 text-[15px] font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
              >
                شروع خرید طلا
              </Link>
              <Link
                href="#price"
                className="border-navy-200 text-navy-800 hover:border-navy-300 hover:bg-cream-50 inline-flex h-12 items-center justify-center rounded-xl border bg-transparent px-7 text-[15px] font-medium transition-colors active:scale-[0.98]"
              >
                مشاهده قیمت طلا
              </Link>
            </div>
          </div>

          {/* ===== ویژوال — کارت قیمت + شمش‌ها ===== */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="hero-enter-visual relative"
              style={{ '--hero-delay': '240ms' } as React.CSSProperties}
              aria-hidden="true"
            >
              <GoldBarsVisual className="mx-auto max-w-[420px]" />
            </div>
            <div
              className="hero-enter relative z-10 mx-auto -mt-8 max-w-sm sm:-mt-10 lg:-mt-14"
              style={{ '--hero-delay': '300ms' } as React.CSSProperties}
            >
              <LiveGoldPriceCard initialPrice={price} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
