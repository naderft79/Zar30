// ============================================
// Zar30 - Coins & Bars Section (سکه و شمش)
// ============================================
// سکشن بدون Card — برای استفاده داخل شیت تحویل فیزیکی
// تبدیل طلای آب‌شده به سکه/شمش + لیست دارایی‌ها
// قیمت در دسترس نبود → state unavailable — تبدیل غیرفعال
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconCoin, IconMinus, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount, formatGoldAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface CoinProduct {
  id: string
  code: string
  name: string
  kind: 'COIN' | 'BAR'
  weightGrams: string
  premiumToman: string
  unitPriceToman: string | null
}

interface CoinHolding {
  id: string
  quantity: number
  product: CoinProduct
}

interface CoinsSectionProps {
  online: boolean
  onChanged?: () => void
}

export function CoinsSection({ online, onChanged }: CoinsSectionProps) {
  const [products, setProducts] = useState<CoinProduct[]>([])
  const [holdings, setHoldings] = useState<CoinHolding[]>([])
  const [priceAvailable, setPriceAvailable] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function load() {
    const res = await apiGetWithRefresh<{
      products: CoinProduct[]
      holdings: CoinHolding[]
      priceAvailable: boolean
    }>('/api/v1/coins')
    if (res.ok) {
      setProducts(res.data?.products ?? [])
      setHoldings(res.data?.holdings ?? [])
      setPriceAvailable(res.data?.priceAvailable ?? false)
    }
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{
        products: CoinProduct[]
        holdings: CoinHolding[]
        priceAvailable: boolean
      }>('/api/v1/coins')
      if (cancelled) return
      if (res.ok) {
        setProducts(res.data?.products ?? [])
        setHoldings(res.data?.holdings ?? [])
        setPriceAvailable(res.data?.priceAvailable ?? false)
      }
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selected = products.find((p) => p.id === productId) ?? null
  const goldNeeded = selected ? Number(selected.weightGrams) * quantity : 0
  const feeTotal = selected ? Number(selected.premiumToman) * quantity : 0

  async function submit() {
    setError(null)
    if (!selected) {
      setError('یک محصول را انتخاب کنید')
      return
    }
    setBusy(true)
    const res = await apiPost(
      '/api/v1/coins/convert',
      { productId: selected.id, quantity },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'تبدیل ناموفق بود')
      return
    }
    setDone(true)
    setProductId(null)
    setQuantity(1)
    void load()
    onChanged?.()
  }

  if (!loaded) return <div className="skeleton-shimmer h-24 rounded-lg" />

  if (done) {
    return (
      <div className="space-y-4 py-2 text-center">
        <IconCoin className="text-gold-600 mx-auto size-10" stroke={1.5} />
        <div>
          <p className="text-foreground text-sm font-bold">تبدیل انجام شد</p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            سکه/شمش شما در امانت نزد پلتفرم نگهداری می‌شود.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setDone(false)}>
          تبدیل جدید
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!priceAvailable && (
        <p className="text-warning bg-warning/10 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px]">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          قیمت لحظه‌ای در دسترس نیست — تبدیل موقتاً غیرفعال است
        </p>
      )}

      {/* دارایی‌های فعلی */}
      {holdings.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-muted-foreground text-[11px]">سکه/شمش‌های شما</span>
          <ul className="divide-border/40 border-border/60 divide-y rounded-xl border">
            {holdings.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-foreground text-xs font-semibold">{h.product.name}</span>
                <span className="text-foreground text-xs font-bold tabular-nums" dir="ltr">
                  {h.quantity}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* انتخاب محصول */}
      <div className="space-y-2">
        <span className="text-muted-foreground text-[11px]">محصول</span>
        <div className="grid grid-cols-2 gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProductId(p.id)}
              className={cn(
                'rounded-xl border p-3 text-right transition-colors',
                productId === p.id
                  ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/30'
                  : 'border-border/60 hover:border-border',
              )}
            >
              <p className="text-foreground text-xs font-bold">{p.name}</p>
              <p className="text-muted-foreground mt-1 text-[10px] tabular-nums" dir="ltr">
                {formatGoldAmount(p.weightGrams)} g
              </p>
              <p className="text-gold-600 mt-0.5 text-[10px] font-semibold tabular-nums" dir="ltr">
                {p.unitPriceToman ? `${formatExactAmount(p.unitPriceToman)} تومان` : 'قیمت نامشخص'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* تعداد */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px]">تعداد</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="کاهش تعداد"
            className="border-border/60 text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
          >
            <IconMinus className="size-4" aria-hidden="true" />
          </button>
          <span className="text-foreground w-8 text-center text-sm font-bold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="افزایش تعداد"
            className="border-border/60 text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-lg border transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* خلاصه هزینه */}
      {selected && (
        <div className="bg-muted/50 space-y-1.5 rounded-xl p-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">طلا از کیف شما</span>
            <span className="text-foreground font-semibold tabular-nums" dir="ltr">
              {formatGoldAmount(goldNeeded)} گرم
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">اجرت از کیف تومانی</span>
            <span className="text-foreground font-semibold tabular-nums" dir="ltr">
              {formatExactAmount(String(feeTotal))} تومان
            </span>
          </div>
        </div>
      )}

      <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
        سکه و شمش شما در امانت نزد پلتفرم نگهداری می‌شود و در درخواست تحویل قابل ارسال است.
      </p>

      {error && (
        <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
      <Button
        className="w-full"
        onClick={submit}
        disabled={busy || !online || !priceAvailable || !selected}
        title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
      >
        {busy ? 'در حال تبدیل…' : 'تبدیل به سکه/شمش'}
      </Button>
    </div>
  )
}
