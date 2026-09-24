// ============================================
// Zar30 - Coins & Bars Card (سکه و شمش)
// ============================================
// تبدیل طلای آب‌شده به سکه/شمش — قیمت هر واحد = وزن × قیمت طلا + اجرت
// کاربر به اندازه وزن طلا و به اندازه اجرت تومان می‌پردازد
// قیمت در دسترس نبود → state unavailable — تبدیل غیرفعال
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconCoin, IconMinus, IconPlus, IconRepeat } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
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

interface CoinsCardProps {
  online: boolean
  onChanged?: () => void
}

export function CoinsCard({ online, onChanged }: CoinsCardProps) {
  const [products, setProducts] = useState<CoinProduct[]>([])
  const [holdings, setHoldings] = useState<CoinHolding[]>([])
  const [priceAvailable, setPriceAvailable] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setSheetOpen(false)
    setProductId(null)
    setQuantity(1)
    void load()
    onChanged?.()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconCoin className="text-gold-600 size-5" stroke={1.75} />
          سکه و شمش
        </CardTitle>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={!online || !priceAvailable}
          className="text-gold-600 hover:text-gold-700 flex items-center gap-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
        >
          <IconRepeat className="size-4" aria-hidden="true" />
          تبدیل
        </button>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="skeleton-shimmer h-10 rounded-lg" />
        ) : (
          <>
            {!priceAvailable && (
              <p className="text-warning bg-warning/10 mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px]">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                قیمت لحظه‌ای در دسترس نیست — تبدیل موقتاً غیرفعال است
              </p>
            )}

            {holdings.length === 0 ? (
              <EmptyState
                icon={IconCoin}
                title="سکه یا شمشی ندارید"
                description="طلای آب‌شده خود را به سکه بهار آزادی یا شمش سریال‌دار تبدیل کنید."
              />
            ) : (
              <ul className="divide-border/40 divide-y">
                {holdings.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-foreground text-xs font-semibold">{h.product.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                        {formatExactAmount(h.product.weightGrams)} گرم × {h.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-foreground text-xs font-bold tabular-nums" dir="ltr">
                        {h.quantity}×
                      </p>
                      {h.product.unitPriceToman && (
                        <p className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                          ≈{' '}
                          {formatExactAmount(String(Number(h.product.unitPriceToman) * h.quantity))}{' '}
                          تومان
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* شیت تبدیل */}
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="تبدیل به سکه و شمش"
        >
          <div className="space-y-4">
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
                      {formatExactAmount(p.weightGrams)} g
                    </p>
                    <p
                      className="text-gold-600 mt-0.5 text-[10px] font-semibold tabular-nums"
                      dir="ltr"
                    >
                      {p.unitPriceToman
                        ? `${formatExactAmount(p.unitPriceToman)} تومان`
                        : 'قیمت نامشخص'}
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
                    {goldNeeded.toFixed(4)} گرم
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
              سکه و شمش شما در امانت نزد پلتفرم نگهداری می‌شود. برای تحویل فیزیکی، از بخش تحویل
              درخواست ثبت کنید.
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
              {busy ? 'در حال تبدیل…' : 'تبدیل'}
            </Button>
          </div>
        </BottomSheet>
      </CardContent>
    </Card>
  )
}
