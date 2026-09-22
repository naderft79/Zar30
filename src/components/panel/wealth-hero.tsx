// ============================================
// Zar30 - Wealth Hero — کارت موجودی اصلی داشبورد
// ============================================
// سطح ممتاز «Luxury Private Banking»: گرافیت لایه‌ای + halo طلایی
// الگوی مرجع: موجودی بزرگ + visibility toggle + اکشن‌های داخل کارت
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpLeft,
  CalendarClock,
  Coins,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { FinancialNumber } from '@/components/financial/financial-number'
import { TrendBadge } from '@/components/financial/trend-badge'
import { cn } from 'cn'

interface WealthHeroProps {
  /** تاریخ امروز یا context کوتاه */
  dateLabel?: string
  totalValue: number | string
  goldGrams: number | string
  tomanBalance: number | string
  /** موجودی مسدودشده تومانی */
  lockedToman?: number | string
  changePercent?: number
  loading?: boolean
  className?: string
}

// اکشن‌های مالی داخل کارت — ورود سریع به مقصدهای اصلی
const HERO_ACTIONS = [
  { href: '/dashboard/assets?action=deposit', label: 'واریز', icon: ArrowDownLeft },
  { href: '/dashboard/assets?action=withdraw', label: 'انتقال', icon: ArrowUpLeft },
] as const

// بنرهای چرخان داخل کارت — هر ۵ ثانیه بنر بعدی
const HERO_BANNERS = [
  {
    href: '/dashboard/trade',
    kicker: 'سرمایه‌گذاری طلای آب‌شده',
    title: 'همراه شما در مسیر سرمایه‌گذاری امن',
    description: 'خرید آنی، شفاف و بدون واسطه — حتی با مبالغ بسیار کم',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/installments',
    kicker: 'طلای قسطی',
    title: 'طلای ۱۸ عیار را قسطی بخرید',
    description: 'پرداخت مرحله‌ای و آسان، مالکیت کامل طلا',
    icon: CalendarClock,
  },
  {
    href: '/dashboard/assets',
    kicker: 'تحویل فیزیکی طلا',
    title: 'طلای دیجیتال شما، قابل تحویل فیزیکی',
    description: 'درخواست تحویل طلای فیزیکی از کیف پول طلایی',
    icon: Package,
  },
] as const

const BANNER_INTERVAL_MS = 5_000

export function WealthHero({
  dateLabel,
  totalValue,
  goldGrams,
  tomanBalance,
  lockedToman,
  changePercent,
  loading = false,
  className,
}: WealthHeroProps) {
  // مخفی‌سازی مقادیر مالی — الگوی رایج اپ‌های بانکی
  const [hidden, setHidden] = useState(false)
  // چرخش خودکار بنرها
  const [bannerIdx, setBannerIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setBannerIdx((i) => (i + 1) % HERO_BANNERS.length),
      BANNER_INTERVAL_MS,
    )
    return () => clearInterval(t)
  }, [])
  const banner = HERO_BANNERS[bannerIdx]!
  const BannerIcon = banner.icon

  return (
    <section
      aria-label="خلاصه دارایی"
      className={cn(
        'surface-wealth gold-rings relative overflow-hidden rounded-3xl border p-4 sm:p-5',
        className,
      )}
    >
      {/* halo تزئینی — صرفاً بصری */}
      <div
        aria-hidden="true"
        className="from-gold-500/15 pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-gradient-to-br to-transparent blur-2xl"
      />

      {/* ردیف بالا — تاریخ امروز */}
      {dateLabel && (
        <div className="relative flex justify-end">
          <span className="bg-cream-50/8 ring-cream-50/12 text-cream-200/90 rounded-full px-3 py-1 text-[11px] font-medium tabular-nums ring-1">
            {dateLabel}
          </span>
        </div>
      )}

      {/* موجودی کل — عدد شاخص + چشم */}
      <div className="relative mt-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="bg-gold-500/15 text-gold-400 flex size-7 items-center justify-center rounded-lg">
            <Wallet className="size-3.5" strokeWidth={1.75} />
          </span>
          <p className="text-cream-300/80 text-label">موجودی کل</p>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'نمایش موجودی' : 'مخفی کردن موجودی'}
            aria-pressed={hidden}
            className="text-cream-300/60 hover:text-gold-300 focus-visible:ring-ring ms-1 flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2"
          >
            {hidden ? (
              <EyeOff className="size-4" strokeWidth={1.75} />
            ) : (
              <Eye className="size-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
        {loading ? (
          <div className="skeleton-shimmer h-10 w-56 rounded-lg" />
        ) : hidden ? (
          <p className="text-cream-50 text-2xl font-extrabold tracking-widest sm:text-3xl">
            ••••••
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1.5">
            <FinancialNumber
              value={totalValue}
              unit="تومان"
              size="xl"
              decimals={0}
              animate
              className="text-cream-50 text-2xl sm:text-3xl"
              unitClassName="text-sm text-cream-300/60"
            />
            {changePercent !== undefined && (
              <TrendBadge value={changePercent} caption="۲۴ ساعت اخیر" className="mb-2" />
            )}
          </div>
        )}
      </div>

      {/* اکشن‌های مالی — گرادیان طلایی، آیکون و متن هم‌خط */}
      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        {HERO_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group from-gold-300 via-gold-400 to-gold-500 focus-visible:ring-gold-200/80 flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-bl shadow-[0_10px_24px_-8px_rgb(212_175_55/0.55)] transition-all duration-(--duration-normal) ease-(--ease-spring) hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgb(212_175_55/0.65)] hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none active:translate-y-0"
          >
            <Icon
              className="text-navy-900/80 size-4 transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-110"
              strokeWidth={2.25}
            />
            <span className="text-navy-900 text-xs font-extrabold">{label}</span>
          </Link>
        ))}
      </div>

      {/* تفکیک دارایی — کیف پول‌های طلایی/تومانی */}
      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <div className="bg-cream-50/6 ring-cream-50/10 flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1">
          <span className="from-gold-400/25 to-gold-600/25 text-gold-400 ring-gold-500/30 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1">
            <Coins className="size-4.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-cream-300/60 text-[10px] font-medium">کیف پول طلایی</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-5 w-20 rounded" />
            ) : hidden ? (
              <span className="text-cream-50 text-sm font-bold tracking-widest">••••</span>
            ) : (
              <FinancialNumber
                value={goldGrams}
                unit="گرم"
                size="md"
                decimals={3}
                className="text-cream-50 text-sm font-bold"
                unitClassName="text-cream-300/50 text-[10px]"
              />
            )}
          </div>
        </div>
        <div className="bg-cream-50/6 ring-cream-50/10 flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1">
          <span className="bg-cream-50/10 text-cream-200 ring-cream-50/15 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1">
            <Wallet className="size-4.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-cream-300/60 text-[10px] font-medium">کیف پول تومانی</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-5 w-20 rounded" />
            ) : hidden ? (
              <span className="text-cream-50 text-sm font-bold tracking-widest">••••</span>
            ) : (
              <FinancialNumber
                value={tomanBalance}
                unit="تومان"
                size="md"
                decimals={0}
                className="text-cream-50 text-sm font-bold"
                unitClassName="text-cream-300/50 text-[10px]"
              />
            )}
          </div>
        </div>
        {lockedToman !== undefined && Number(lockedToman) > 0 && (
          <div className="bg-warning/8 ring-warning/20 col-span-2 flex items-center justify-between rounded-2xl px-3.5 py-2 ring-1">
            <p className="text-cream-300/70 text-[10px] font-medium">مسدود شده</p>
            {hidden ? (
              <span className="text-warning text-sm font-bold tracking-widest">••••</span>
            ) : (
              <FinancialNumber
                value={lockedToman}
                unit="تومان"
                size="md"
                decimals={0}
                className="text-warning text-sm font-bold"
                unitClassName="text-cream-300/50 text-[10px]"
              />
            )}
          </div>
        )}
      </div>

      {/* بنر چرخان — سفید، داخل کارت؛ هر ۵ ثانیه بنر بعدی */}
      <div className="relative mt-4">
        <Link
          key={bannerIdx}
          href={banner.href}
          className="animate-fade-up bg-cream-50 focus-visible:ring-gold-500/70 flex items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-transform duration-(--duration-normal) ease-(--ease-spring) hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none sm:px-5"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-gold-600 text-[10px] font-bold">{banner.kicker}</p>
            <p className="text-navy-800 text-sm leading-5 font-extrabold sm:text-base">
              {banner.title}
            </p>
            <p className="text-navy-800/55 text-[11px] leading-4.5 sm:text-xs">
              {banner.description}
            </p>
          </div>
          <span className="from-gold-400/20 to-gold-600/20 text-gold-600 ring-gold-500/25 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-bl ring-1 sm:size-12">
            <BannerIcon className="size-5" strokeWidth={1.75} />
          </span>
        </Link>
        {/* نشانگر بنرها */}
        <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden="true">
          {HERO_BANNERS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-(--duration-normal)',
                i === bannerIdx ? 'bg-gold-400 w-4' : 'bg-cream-50/25 w-1',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
