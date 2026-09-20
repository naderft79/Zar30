// ============================================
// Zar30 - Wealth Hero — قلب بصری داشبورد
// ============================================
// سطح ممتاز «Luxury Private Banking»: Navy لایه‌ای + halo طلایی کنترل‌شده
// مقادیر فعلاً Placeholder هستند — Financial Core در Phaseهای بعدی
// ============================================

import { Coins, Wallet } from 'lucide-react'
import { FinancialNumber } from '@/components/financial/financial-number'
import { TrendBadge } from '@/components/financial/trend-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from 'cn'

interface WealthHeroProps {
  greeting: string
  /** تاریخ امروز یا context کوتاه */
  dateLabel?: string
  totalValue: number | string
  goldGrams: number | string
  rialBalance: number | string
  changePercent?: number
  statusLabel?: string
  statusTone?: 'success' | 'warning' | 'error'
  loading?: boolean
  className?: string
}

export function WealthHero({
  greeting,
  dateLabel,
  totalValue,
  goldGrams,
  rialBalance,
  changePercent,
  statusLabel,
  statusTone = 'success',
  loading = false,
  className,
}: WealthHeroProps) {
  return (
    <section
      aria-label="خلاصه دارایی"
      className={cn(
        'surface-wealth gold-rings relative overflow-hidden rounded-2xl border p-6 sm:p-8',
        className,
      )}
    >
      {/* halo تزئینی — صرفاً بصری */}
      <div
        aria-hidden="true"
        className="from-gold-500/10 pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-gradient-to-br to-transparent blur-2xl"
      />

      {/* ردیف بالا — سلامت + وضعیت */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-cream-50 text-balance">{greeting}</h1>
          {dateLabel && <p className="text-navy-200/70 mt-1.5 text-sm">{dateLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          {statusLabel && <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>}
          <StatusBadge tone="gold" dot={false}>
            پیش‌نمایش
          </StatusBadge>
        </div>
      </div>

      {/* ارزش کل — عدد شاخص مالی */}
      <div className="relative mt-8 sm:mt-10">
        <p className="text-cream-300/80 text-label mb-2">ارزش کل دارایی</p>
        {loading ? (
          <div className="skeleton-shimmer h-12 w-56 rounded-lg" />
        ) : (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <FinancialNumber
              value={totalValue}
              unit="تومان"
              size="xl"
              decimals={0}
              animate
              className="text-cream-50 text-4xl sm:text-5xl"
              unitClassName="text-base text-navy-200/70"
            />
            {changePercent !== undefined && (
              <TrendBadge value={changePercent} caption="۲۴ ساعت اخیر" className="mb-2" />
            )}
          </div>
        )}
      </div>

      {/* تفکیک دارایی — طلا / ریال */}
      <div className="border-cream-50/10 relative mt-8 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="bg-gold-500/15 text-gold-400 ring-gold-500/25 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Coins className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-navy-200/70 text-[11px]">موجودی طلا</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-6 w-24 rounded" />
            ) : (
              <FinancialNumber
                value={goldGrams}
                unit="گرم"
                size="md"
                decimals={3}
                className="text-cream-100"
                unitClassName="text-navy-200/60"
              />
            )}
          </div>
        </div>
        <div className="sm:border-cream-50/10 flex items-center gap-3 sm:border-r sm:pr-4">
          <span className="bg-navy-500/30 text-navy-100 ring-navy-400/30 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <Wallet className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-navy-200/70 text-[11px]">موجودی ریالی</p>
            {loading ? (
              <div className="skeleton-shimmer mt-1 h-6 w-24 rounded" />
            ) : (
              <FinancialNumber
                value={rialBalance}
                unit="تومان"
                size="md"
                decimals={0}
                className="text-cream-100"
                unitClassName="text-navy-200/60"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
