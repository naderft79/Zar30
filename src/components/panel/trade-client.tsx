// ============================================
// Zar30 - Trade Client (Real Financial Engine)
// ============================================
// خرید/فروش واقعی — POST /api/v1/orders با Idempotency-Key
// قیمت از GoldPrice سرور؛ خطاهای مالی deterministic نمایش داده می‌شوند
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IconArrowDownLeft,
  IconArrowUpLeft,
  IconHistory,
  IconChartLine,
  IconRepeat,
  IconAlertTriangle,
  IconCircleCheck,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'

interface WalletAccount {
  assetType: string
  balance: string
  lockedBalance: string
  available: string
}

interface OrderRow {
  id: string
  type: 'BUY' | 'SELL'
  goldAmount: string
  tomanAmount: string
  unitPrice: string
  fee: string
  total: string
  status: string
  createdAt: string
}

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
  updatedAt: string
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

export function TradeClient() {
  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [price, setPrice] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)

  // side=buy|sell از query (مثلاً لینک قیمت داشبورد) حالت اولیه را تعیین می‌کند
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'BUY' | 'SELL'>(
    searchParams.get('side') === 'sell' ? 'SELL' : 'BUY',
  )
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadAll() {
    const [walletRes, ordersRes, priceRes] = await Promise.all([
      apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
      apiGetWithRefresh<{ orders: OrderRow[] }>('/api/v1/orders?limit=10'),
      apiGetWithRefresh<PriceData>('/api/v1/price'),
    ])
    if (walletRes.ok) setAccounts(walletRes.data?.accounts ?? [])
    if (ordersRes.ok) setOrders(ordersRes.data?.orders ?? [])
    if (priceRes.ok && priceRes.data) setPrice(priceRes.data)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [walletRes, ordersRes, priceRes] = await Promise.all([
        apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
        apiGetWithRefresh<{ orders: OrderRow[] }>('/api/v1/orders?limit=10'),
        apiGetWithRefresh<PriceData>('/api/v1/price'),
      ])
      if (cancelled) return
      if (walletRes.ok) setAccounts(walletRes.data?.accounts ?? [])
      if (ordersRes.ok) setOrders(ordersRes.data?.orders ?? [])
      if (priceRes.ok && priceRes.data) setPrice(priceRes.data)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toman = accounts.find((a) => a.assetType === 'TOMAN')
  const gold = accounts.find((a) => a.assetType === 'GOLD')

  async function submit() {
    setError(null)
    setSuccess(null)
    if (!/^\d+(\.\d{1,8})?$/.test(amount) || Number(amount) <= 0) {
      setError(mode === 'BUY' ? 'مبلغ تومانی معتبر وارد کنید' : 'مقدار طلا معتبر وارد کنید')
      return
    }
    setBusy(true)
    const body =
      mode === 'BUY' ? { type: 'BUY', tomanAmount: amount } : { type: 'SELL', goldAmount: amount }
    const res = await apiPost<{ order: OrderRow }>('/api/v1/orders', body, {
      'Idempotency-Key': crypto.randomUUID(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'معامله ناموفق بود')
      return
    }
    const o = res.data!.order
    setSuccess(
      mode === 'BUY'
        ? `خرید انجام شد — ${formatExactAmount(o.goldAmount)} گرم طلا`
        : `فروش انجام شد — ${formatExactAmount(o.total)} تومان به کیف پول شما واریز شد`,
    )
    setAmount('')
    void loadAll()
  }

  return (
    <div className="animate-stagger space-y-5">
      {/* موجودی + قیمت لحظه‌ای */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-muted-foreground text-[11px]">موجودی تومان (آزاد)</p>
            <p className="text-foreground mt-1 text-lg font-bold tabular-nums">
              {loading ? '…' : `${formatExactAmount(toman?.available ?? '0')} تومان`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-muted-foreground text-[11px]">موجودی طلا (آزاد)</p>
            <p className="text-foreground mt-1 text-lg font-bold tabular-nums">
              {loading ? '…' : `${formatExactAmount(gold?.available ?? '0')} گرم`}
            </p>
          </CardContent>
        </Card>
        <Card className="surface-wealth gold-rings relative overflow-hidden">
          <CardContent className="relative pt-5 pb-4">
            <p className="text-cream-300/60 flex items-center gap-1.5 text-[11px]">
              <IconChartLine className="text-gold-400 size-3.5" stroke={1.75} />
              نرخ لحظه‌ای (هر گرم)
            </p>
            {price ? (
              <div className="text-cream-50 mt-1 space-y-0.5 text-sm font-bold tabular-nums">
                <p>
                  خرید:{' '}
                  <span dir="ltr">{formatExactAmount(String(Math.round(price.buyPrice)))}</span>
                </p>
                <p>
                  فروش:{' '}
                  <span dir="ltr">{formatExactAmount(String(Math.round(price.sellPrice)))}</span>
                </p>
                {!price.isLive && (
                  <p className="text-warning text-[10px] font-medium">قیمت نمایشی — demo</p>
                )}
              </div>
            ) : (
              <p className="text-cream-300/50 mt-1 text-xs">
                {loading ? '…' : 'قیمت در دسترس نیست'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* فرم معامله */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معامله آنی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segmented control — pill لوکس با indicator طلایی */}
          <div className="bg-muted border-border/50 grid grid-cols-2 gap-1 rounded-2xl border p-1">
            <button
              type="button"
              onClick={() => {
                setMode('BUY')
                setError(null)
                setSuccess(null)
              }}
              aria-pressed={mode === 'BUY'}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-(--duration-normal) ${
                mode === 'BUY'
                  ? 'bg-navy-700 text-cream-50 shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <IconArrowDownLeft className="size-4" stroke={2} />
              خرید طلا
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SELL')
                setError(null)
                setSuccess(null)
              }}
              aria-pressed={mode === 'SELL'}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-(--duration-normal) ${
                mode === 'SELL'
                  ? 'bg-navy-700 text-cream-50 shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <IconArrowUpLeft className="size-4" stroke={2} />
              فروش طلا
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-[11px]">
              {mode === 'BUY' ? 'مبلغ خرید (تومان)' : 'مقدار فروش (گرم)'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'BUY' ? '100000' : '0.500'}
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
              <IconAlertTriangle className="size-3.5" aria-hidden="true" />
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-success flex items-center gap-1.5 text-xs">
              <IconCircleCheck className="size-3.5" aria-hidden="true" />
              {success}
            </p>
          )}

          <Button variant="default" className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'در حال انجام معامله…' : mode === 'BUY' ? 'خرید طلا' : 'فروش طلا'}
          </Button>
          <p className="text-muted-foreground text-[10px] leading-4">
            معامله با آخرین قیمت معتبر سرور انجام می‌شود — قیمت دقیق در سند سفارش ثبت می‌گردد.
          </p>
        </CardContent>
      </Card>

      {/* تاریخچه معاملات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconHistory className="text-gold-600 size-5" stroke={1.75} />
            تاریخچه معاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState
              icon={IconRepeat}
              title="هنوز معامله‌ای انجام نداده‌اید"
              description="پس از اولین خرید یا فروش، تاریخچه کامل معاملات شما اینجا ثبت می‌شود."
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-xl ${
                        o.type === 'BUY'
                          ? 'bg-gold-500/15 text-gold-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {o.type === 'BUY' ? (
                        <IconArrowDownLeft className="size-4" stroke={2} />
                      ) : (
                        <IconArrowUpLeft className="size-4" stroke={2} />
                      )}
                    </span>
                    <div>
                      <p className="text-foreground text-xs font-semibold">
                        {o.type === 'BUY' ? 'خرید' : 'فروش'} — {formatExactAmount(o.goldAmount)} گرم
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                        {new Date(o.createdAt).toLocaleString('fa-IR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                      {formatExactAmount(o.total)}{' '}
                      <span className="text-muted-foreground">تومان</span>
                    </p>
                    <StatusBadge tone="gold" dot={false} className="mt-1">
                      {o.status === 'FILLED'
                        ? 'انجام‌شده'
                        : o.status === 'REVERSED'
                          ? 'برگشت‌خورده'
                          : o.status}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
