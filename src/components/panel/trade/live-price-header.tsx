// ============================================
// Zar30 - Trade Terminal — Market Bar
// ============================================
// نوار بازار — هماهنگ با تم برنامه (لایت + دارک)
// قیمت خرید/فروش + اسپرد + تغییر ۲۴س + نشانگر زنده
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { apiGet } from '@/lib/api/client'
import { formatExactAmount, formatPercentChange, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
  updatedAt: string
  source?: string
}

export interface LivePriceHeaderProps {
  priceChange24h?: number | null
  className?: string
}

export function LivePriceHeader({ priceChange24h, className }: LivePriceHeaderProps) {
  const [price, setPrice] = useState<PriceData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const res = await apiGet<PriceData>('/api/v1/price')
    if (res.ok && res.data) setPrice(res.data)
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGet<PriceData>('/api/v1/price')
      if (cancelled) return
      if (res.ok && res.data) setPrice(res.data)
      setLoaded(true)
    })()
    const timer = setInterval(() => {
      if (!cancelled) void load()
    }, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  async function manualRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const spread = price ? price.buyPrice - price.sellPrice : 0
  const spreadPct = price && price.buyPrice > 0 ? (spread / price.buyPrice) * 100 : 0
  const up = (priceChange24h ?? 0) >= 0

  return (
    <div
      className={cn(
        'terminal-surface flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl px-4 py-3',
        className,
      )}
      dir="rtl"
    >
      {/* جفت معاملاتی */}
      <div className="flex items-center gap-2.5">
        <span className="bg-gold-500/15 text-gold-700 dark:text-gold-400 flex size-9 items-center justify-center rounded-lg text-base font-black">
          ز
        </span>
        <div>
          <p className="text-foreground text-sm leading-tight font-extrabold">
            طلا / تومان
            <span className="text-muted-foreground mr-1.5 text-[9px] font-normal">۱۸ عیار</span>
          </p>
          <p className="text-muted-foreground text-[10px] tabular-nums">
            {price?.isLive ? 'زنده' : 'تاخیری'} · هر گرم
          </p>
        </div>
      </div>

      <div className="bg-border hidden h-8 w-px sm:block" />

      {/* قیمت خرید (از کاربر) */}
      <div>
        <p className="text-muted-foreground text-[9px]">فروش شما</p>
        {!loaded && !price ? (
          <div className="skeleton-shimmer mt-1 h-5 w-24 rounded" />
        ) : (
          <p className="text-error font-num mt-0.5 text-base font-bold" dir="ltr">
            {formatExactAmount(String(Math.round(price?.sellPrice ?? 0)))}
          </p>
        )}
      </div>

      {/* قیمت فروش (به کاربر) — شاخص */}
      <div>
        <p className="text-muted-foreground text-[9px]">خرید شما</p>
        {!loaded && !price ? (
          <div className="skeleton-shimmer mt-1 h-5 w-24 rounded" />
        ) : (
          <p
            className="text-gold-700 dark:text-gold-400 font-num mt-0.5 text-base font-bold"
            dir="ltr"
          >
            {formatExactAmount(String(Math.round(price?.buyPrice ?? 0)))}
          </p>
        )}
      </div>

      {/* تغییر ۲۴ ساعته */}
      {priceChange24h != null && loaded && (
        <div>
          <p className="text-muted-foreground text-[9px]">تغییر ۲۴س</p>
          <p
            className={cn(
              'font-num mt-0.5 text-base font-bold tabular-nums',
              up ? 'text-success' : 'text-error',
            )}
            dir="ltr"
          >
            {formatPercentChange(priceChange24h)}
          </p>
        </div>
      )}

      {/* اسپرد */}
      {price && spread > 0 && (
        <div className="hidden md:block">
          <p className="text-muted-foreground text-[9px]">اسپرد</p>
          <p
            className="text-foreground font-num mt-0.5 text-xs font-semibold tabular-nums"
            dir="ltr"
          >
            {formatExactAmount(String(spread))}
            <span className="text-muted-foreground mr-1 text-[9px]">
              ({toPersianDigits(spreadPct.toFixed(2))}٪)
            </span>
          </p>
        </div>
      )}

      {/* وضعیت زنده + رفرش — انتها */}
      <div className="mr-auto flex items-center gap-2">
        {price?.isLive ? (
          <span className="text-success flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="relative flex size-1.5">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-success relative inline-flex size-1.5 rounded-full" />
            </span>
            LIVE
          </span>
        ) : (
          <span className="text-warning text-[10px] font-semibold">DELAYED</span>
        )}
        <button
          type="button"
          onClick={manualRefresh}
          disabled={refreshing}
          aria-label="به‌روزرسانی قیمت"
          className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 hover:bg-muted flex size-7 items-center justify-center rounded-lg transition-colors disabled:opacity-60"
        >
          <IconRefresh
            className={cn('size-3.5', refreshing && 'animate-spin')}
            stroke={1.75}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
