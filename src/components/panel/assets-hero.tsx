// ============================================
// Zar30 - Assets Hero — کارت اصلی صفحه دارایی
// ============================================
// الگوی WealthHero داشبورد — سطح سورمه‌ای/گرافیت «Luxury Private Banking»
// ارزش کل دارایی + چشم سراسری + حروف + TrendBadge + ۴ اکشن مالی
// ============================================

'use client'

import {
  IconCashBanknotePlus,
  IconCreditCardPay,
  IconEye,
  IconEyeOff,
  IconPackage,
  IconRefresh,
  IconTransfer,
} from '@tabler/icons-react'
import { FinancialNumber } from '@/components/financial/financial-number'
import { TrendBadge } from '@/components/financial/trend-badge'
import { toPersianWords } from '@/lib/utils/format'
import { useBalanceVisibility } from '@/lib/hooks/use-balance-visibility'
import { cn } from 'cn'

export type AssetsAction = 'deposit' | 'withdraw' | 'transfer' | 'delivery'

const HERO_ACTIONS: { action: AssetsAction; label: string; icon: typeof IconTransfer }[] = [
  { action: 'deposit', label: 'واریز', icon: IconCashBanknotePlus },
  { action: 'withdraw', label: 'برداشت', icon: IconCreditCardPay },
  { action: 'transfer', label: 'انتقال', icon: IconTransfer },
  { action: 'delivery', label: 'تحویل', icon: IconPackage },
]

interface AssetsHeroProps {
  totalValue: number | string
  changePercent?: number | null
  loading?: boolean
  online: boolean
  onAction: (action: AssetsAction) => void
  /** به‌روزرسانی دستی موجودی — آیکون رفرش گوشه بالا راست */
  onRefresh?: () => void
  refreshing?: boolean
  className?: string
}

export function AssetsHero({
  totalValue,
  changePercent,
  loading = false,
  online,
  onAction,
  onRefresh,
  refreshing = false,
  className,
}: AssetsHeroProps) {
  // چشم سراسری — مشترک با WealthHero داشبورد
  const [hidden, toggleHidden] = useBalanceVisibility()

  return (
    <section
      aria-label="ارزش کل دارایی"
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

      {/* گوشه بالا سمت چپ — آیکون رفرش + بج تغییر ۲۴ ساعته */}
      {(onRefresh || (!loading && !hidden && changePercent != null)) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 sm:top-5 sm:left-5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="به‌روزرسانی موجودی"
              title="به‌روزرسانی موجودی"
              className="text-cream-300/60 hover:text-gold-300 hover:bg-cream-50/8 focus-visible:ring-ring flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
            >
              <IconRefresh
                className={cn('size-4', refreshing && 'animate-spin')}
                stroke={1.75}
                aria-hidden="true"
              />
            </button>
          )}
          {!loading && !hidden && changePercent != null && (
            <TrendBadge value={changePercent} caption="۲۴ ساعت اخیر" />
          )}
        </div>
      )}

      <div className="relative mt-1">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="text-cream-300/80 text-label">موجودی کل</p>
          <button
            type="button"
            onClick={toggleHidden}
            aria-label={hidden ? 'نمایش موجودی' : 'مخفی کردن موجودی'}
            aria-pressed={hidden}
            className="text-cream-300/60 hover:text-gold-300 focus-visible:ring-ring ms-1 flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2"
          >
            {hidden ? (
              <IconEyeOff className="size-4" stroke={1.75} />
            ) : (
              <IconEye className="size-4" stroke={1.75} />
            )}
          </button>
        </div>

        {loading ? (
          <div className="skeleton-shimmer h-12 w-64 rounded-lg" />
        ) : hidden ? (
          <p className="text-cream-50 text-3xl font-extrabold tracking-widest sm:text-4xl">
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
              className="text-cream-50 text-4xl sm:text-5xl"
              unitClassName="text-gold-400 text-base font-bold sm:text-lg"
            />
            {Number(totalValue) > 0 && (
              <p className="text-cream-300/55 mb-2 text-[11px] sm:text-xs">
                {toPersianWords(totalValue)} تومان
              </p>
            )}
          </div>
        )}
      </div>

      {/* ۴ اکشن مالی — شیشه‌ای سورمه‌ای؛ آفلاین غیرفعال */}
      <div className="relative mt-4 grid grid-cols-4 gap-2.5">
        {HERO_ACTIONS.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            disabled={!online}
            title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
            className="group bg-navy-300/20 ring-cream-50/15 hover:bg-navy-300/30 focus-visible:ring-cream-50/40 flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-2xl py-2 ring-1 backdrop-blur-xl transition-colors duration-(--duration-normal) ease-(--ease-out) ring-inset focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon className="text-cream-50 size-6 shrink-0" stroke={1.75} aria-hidden="true" />
            <span className="text-cream-50 text-[10px] font-bold sm:text-xs">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
