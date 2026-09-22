// ============================================
// Zar30 - Wealth Hero — کارت موجودی اصلی داشبورد
// ============================================
// سطح ممتاز «Luxury Private Banking»: گرافیت لایه‌ای + halo طلایی
// الگوی مرجع: موجودی بزرگ + visibility toggle + اکشن‌های داخل کارت
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpLeft, CalendarClock, Coins, Eye, EyeOff, Wallet } from 'lucide-react'
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
  { href: '/dashboard/assets?action=withdraw', label: 'برداشت', icon: ArrowUpLeft },
  { href: '/dashboard/trade', label: 'خرید طلا', icon: Coins },
  { href: '/dashboard/installments', label: 'قسطی', icon: CalendarClock },
] as const

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

  return (
    <section
      aria-label="خلاصه دارایی"
      className={cn(
        'surface-wealth gold-rings relative overflow-hidden rounded-3xl border p-5 sm:p-6',
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
      <div className="relative mt-4 sm:mt-5">
        <div className="mb-2 flex items-center gap-2">
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
          <div className="skeleton-shimmer h-12 w-56 rounded-lg" />
        ) : hidden ? (
          <p className="text-cream-50 text-3xl font-extrabold tracking-widest sm:text-4xl">
            ••••••
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <FinancialNumber
              value={totalValue}
              unit="تومان"
              size="xl"
              decimals={0}
              animate
              className="text-cream-50 text-3xl sm:text-4xl"
              unitClassName="text-base text-cream-300/60"
            />
            {changePercent !== undefined && (
              <TrendBadge value={changePercent} caption="۲۴ ساعت اخیر" className="mb-2" />
            )}
          </div>
        )}
      </div>

      {/* اکشن‌های مالی — داخل کارت، thumb-friendly */}
      <div className="relative mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:gap-3">
        {HERO_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group bg-cream-50/6 hover:bg-gold-500/15 border-cream-50/8 hover:border-gold-500/30 focus-visible:ring-gold-500/60 flex min-h-[44px] flex-col items-center justify-center gap-1.5 rounded-2xl border py-2.5 transition-all duration-(--duration-normal) ease-(--ease-out) focus-visible:ring-2 focus-visible:outline-none sm:flex-row sm:gap-2"
          >
            <Icon
              className="text-gold-400 size-4.5 transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-110 sm:size-4"
              strokeWidth={1.75}
            />
            <span className="text-cream-100 text-[10px] font-medium sm:text-xs">{label}</span>
          </Link>
        ))}
      </div>

      {/* تفکیک دارایی — طلا / تومان / مسدود */}
      <div className="border-cream-50/10 relative mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <span className="bg-gold-500/15 text-gold-400 ring-gold-500/25 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Coins className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-cream-300/60 text-[11px]">طلای آب‌شده</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-6 w-24 rounded" />
            ) : hidden ? (
              <span className="text-cream-100 text-base font-bold tracking-widest">••••</span>
            ) : (
              <FinancialNumber
                value={goldGrams}
                unit="گرم"
                size="md"
                decimals={3}
                className="text-cream-100"
                unitClassName="text-cream-300/50"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-cream-50/8 text-cream-200 ring-cream-50/15 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Wallet className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-cream-300/60 text-[11px]">موجودی آزاد</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-6 w-24 rounded" />
            ) : hidden ? (
              <span className="text-cream-100 text-base font-bold tracking-widest">••••</span>
            ) : (
              <FinancialNumber
                value={tomanBalance}
                unit="تومان"
                size="md"
                decimals={0}
                className="text-cream-100"
                unitClassName="text-cream-300/50"
              />
            )}
          </div>
        </div>
        {lockedToman !== undefined && Number(lockedToman) > 0 && (
          <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
            <div className="sm:border-cream-50/10 min-w-0 sm:border-r sm:pr-4">
              <p className="text-cream-300/60 text-[11px]">مسدود شده</p>
              {hidden ? (
                <span className="text-warning text-base font-bold tracking-widest">••••</span>
              ) : (
                <FinancialNumber
                  value={lockedToman}
                  unit="تومان"
                  size="md"
                  decimals={0}
                  className="text-warning"
                  unitClassName="text-cream-300/50"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
