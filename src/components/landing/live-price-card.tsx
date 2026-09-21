// ============================================
// Zar30 - Live Gold Price Card (Landing)
// ============================================
// کارت قیمت طلا برای Hero — fetch از /api/v1/price
// نشانگر «زنده» فقط وقتی داده واقعاً live است؛
// در حالت Demo برچسب صریح نمایش داده می‌شود (no-fake-data)
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { toPersianDigits, formatRial } from '@/lib/utils/utils'
import type { GoldPrice } from '@/lib/price/types'
import { cn } from 'cn'

interface LivePriceCardProps {
  /** قیمت اولیه از Server — برای SSR بدون flash */
  initialPrice: GoldPrice
}

export function LiveGoldPriceCard({ initialPrice }: LivePriceCardProps) {
  const [price, setPrice] = useState<GoldPrice>(initialPrice)
  const [reference, setReference] = useState<number | null>(null)
  const [error, setError] = useState(false)

  const fetchPrice = useCallback(async () => {
    try {
      setError(false)
      const res = await fetch('/api/v1/price', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      if (json.success && json.data) {
        setPrice((prev) => {
          setReference(prev.buyPrice)
          return json.data as GoldPrice
        })
      }
    } catch {
      setError(true)
    }
  }, [])

  // polling هر ۶۰ ثانیه — فقط هنگام visibility واقعی
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchPrice()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrice])

  const change = reference === null ? 0 : price.buyPrice - reference
  const changePercent = reference && reference > 0 ? (change / reference) * 100 : 0

  return (
    <div className="border-navy-100/90 rounded-2xl border bg-white p-5 shadow-[0_20px_48px_-16px_rgb(16_29_56/0.18)]">
      {/* سربرگ — نام دارایی + وضعیت */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="from-gold-300 to-gold-600 inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="#0f1a33" opacity="0.25" />
              <circle cx="12" cy="12" r="9" stroke="#0f1a33" strokeWidth="1.6" />
              <path
                d="M9 8h6l-3.8 5H15"
                stroke="#0f1a33"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-navy-950 text-sm font-bold">طلای آب‌شده ۱۸ عیار</p>
            <p className="text-navy-400 text-[11px]">هر گرم · ریال</p>
          </div>
        </div>

        {price.isLive ? (
          <span className="border-success/30 bg-success/5 text-success inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
            <span className="relative flex size-2">
              <span className="animate-pulse-soft bg-success absolute inline-flex h-full w-full rounded-full opacity-60" />
              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>
            زنده
          </span>
        ) : (
          <span className="border-warning/40 bg-warning/5 text-warning inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            داده نمایشی
          </span>
        )}
      </div>

      {/* قیمت‌ها */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cream-50 rounded-xl p-3.5">
          <p className="text-navy-400 mb-1 text-[11px]">خرید از شما</p>
          <p className="text-navy-950 text-lg font-bold tabular-nums" dir="ltr">
            {error ? '—' : toPersianDigits(formatRial(price.sellPrice))}
          </p>
        </div>
        <div className="bg-cream-50 rounded-xl p-3.5">
          <p className="text-navy-400 mb-1 text-[11px]">فروش به شما</p>
          <p className="text-navy-950 text-lg font-bold tabular-nums" dir="ltr">
            {error ? '—' : toPersianDigits(formatRial(price.buyPrice))}
          </p>
        </div>
      </div>

      {/* تغییر — فقط وقتی مرجع واقعی از polling داریم */}
      <div className="border-navy-100/80 mt-3.5 flex items-center justify-between border-t pt-3">
        <p className="text-navy-400 text-[11px] tabular-nums">
          به‌روزرسانی:{' '}
          {new Date(price.updatedAt).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {reference !== null && change !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
              change > 0 ? 'text-success' : 'text-error',
            )}
            dir="ltr"
          >
            {change > 0 ? (
              <TrendingUp className="size-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden="true" />
            )}
            {toPersianDigits(Math.abs(changePercent).toFixed(2))}٪
          </span>
        )}
      </div>
    </div>
  )
}
