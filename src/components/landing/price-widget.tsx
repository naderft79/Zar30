// ============================================
// Zar30 - Gold Price Widget (Client)
// ============================================
// ویجت قیمت طلا — fetch از /api/v1/price + polling هر ۶۰ ثانیه
// داده فعلی Demo است و UI آن را صریحاً اعلام می کند
// ============================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toPersianDigits, formatRial } from '@/lib/utils/utils'
import type { GoldPrice } from '@/lib/price/types'
import { cn } from 'cn'

interface PriceWidgetProps {
  /** قیمت اولیه از Server — برای SSR بدون flash */
  initialPrice: GoldPrice
}

export function PriceWidget({ initialPrice }: PriceWidgetProps) {
  const [price, setPrice] = useState<GoldPrice>(initialPrice)
  const [previousBuy, setPreviousBuy] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchPrice = useCallback(async () => {
    try {
      setError(false)
      const res = await fetch('/api/v1/price', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      if (json.success && json.data) {
        setPrice((prev) => {
          setPreviousBuy(prev.buyPrice)
          return json.data
        })
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling هر ۶۰ ثانیه
  useEffect(() => {
    const interval = setInterval(fetchPrice, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrice])

  const trend = previousBuy === null ? 0 : price.buyPrice - previousBuy

  return (
    <Card className="border-gold/30 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-gold/20 flex size-9 items-center justify-center rounded-lg">
              <TrendingUp className="text-gold size-4" />
            </span>
            <h3 className="text-foreground font-semibold">قیمت طلای ۱۸ عیار</h3>
          </div>
          {/* برچسب Demo — همیشه وقتی داده Live نیست نمایش داده می شود */}
          {!price.isLive && (
            <Badge variant="outline" className="border-warning/50 text-warning gap-1">
              <AlertCircle className="size-3" />
              Demo / پیش‌نمایش
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">خرید از شما</p>
            <p className="text-foreground text-xl font-bold tabular-nums sm:text-2xl" dir="ltr">
              {toPersianDigits(formatRial(price.sellPrice))}
            </p>
            <p className="text-muted-foreground text-xs">ریال / گرم</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">فروش به شما</p>
            <div className="flex items-center gap-2">
              <p className="text-foreground text-xl font-bold tabular-nums sm:text-2xl" dir="ltr">
                {toPersianDigits(formatRial(price.buyPrice))}
              </p>
              {trend !== 0 && (
                <span
                  className={cn(
                    'inline-flex items-center text-xs font-medium',
                    trend > 0 ? 'text-success' : 'text-error',
                  )}
                >
                  {trend > 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">ریال / گرم</p>
          </div>
        </div>

        <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
          <p className="text-muted-foreground text-xs">
            {error ? (
              <span className="text-error">خطا در دریافت قیمت</span>
            ) : (
              <>
                به‌روزرسانی:{' '}
                {new Date(price.updatedAt).toLocaleTimeString('fa-IR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </p>
          <button
            onClick={() => {
              setLoading(true)
              fetchPrice()
            }}
            disabled={loading}
            className="text-muted-foreground hover:text-gold inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
            aria-label="به‌روزرسانی قیمت"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            بروزرسانی
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
