// ============================================
// Zar30 - Price Alerts Card (هشدار قیمت طلا)
// ============================================
// هشدار قیمت — بالاتر/پایین‌تر از آستانه → notification درون‌برنامه‌ای
// سمت سرور با هر snapshot قیمت چک می‌شود؛ هر هشدار یک‌بار فایر می‌شود
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconBell, IconPlus, IconTrash } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiGetWithRefresh, apiPost, apiDelete } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface PriceAlert {
  id: string
  targetPrice: string
  direction: 'ABOVE' | 'BELOW'
  active: boolean
  triggeredAt: string | null
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface PriceAlertsCardProps {
  online: boolean
  currentPrice?: number | null
  onChanged?: () => void
}

export function PriceAlertsCard({ online, currentPrice, onChanged }: PriceAlertsCardProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [target, setTarget] = useState('')
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await apiGetWithRefresh<{ alerts: PriceAlert[] }>('/api/v1/price-alerts')
    if (res.ok) setAlerts(res.data?.alerts ?? [])
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ alerts: PriceAlert[] }>('/api/v1/price-alerts')
      if (cancelled) return
      if (res.ok) setAlerts(res.data?.alerts ?? [])
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    setError(null)
    if (!/^\d+$/.test(target) || Number(target) <= 0) {
      setError('قیمت هدف را به تومان وارد کنید')
      return
    }
    setBusy(true)
    const res = await apiPost('/api/v1/price-alerts', { targetPrice: target, direction })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت هشدار ناموفق بود')
      return
    }
    setSheetOpen(false)
    setTarget('')
    void load()
    onChanged?.()
  }

  async function remove(id: string) {
    const res = await apiDelete(`/api/v1/price-alerts/${id}`)
    if (res.ok) void load()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBell className="text-gold-600 size-5" stroke={1.75} />
          هشدار قیمت طلا
        </CardTitle>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={!online}
          className="text-gold-600 hover:text-gold-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
        >
          <IconPlus className="size-4" aria-hidden="true" />
          هشدار جدید
        </button>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="skeleton-shimmer h-10 rounded-lg" />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={IconBell}
            title="هشداری ثبت نشده است"
            description="وقتی قیمت طلا به آستانه شما رسید، با اعلان درون‌برنامه‌ای مطلع می‌شوید."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-foreground text-xs font-semibold">
                    {a.direction === 'ABOVE' ? 'بالاتر از' : 'پایین‌تر از'}{' '}
                    <span className="tabular-nums" dir="ltr">
                      {formatExactAmount(a.targetPrice)}
                    </span>{' '}
                    تومان
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">
                    {a.triggeredAt
                      ? `فعال شد در ${new Date(a.triggeredAt).toLocaleDateString('fa-IR', { dateStyle: 'short' })}`
                      : 'در انتظار رسیدن قیمت'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone={a.active ? 'gold' : 'neutral'} dot={false}>
                    {a.active ? 'فعال' : 'فایر شده'}
                  </StatusBadge>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={!online}
                    aria-label="حذف هشدار"
                    className="text-muted-foreground hover:text-error transition-colors"
                  >
                    <IconTrash className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* شیت هشدار جدید */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="هشدار قیمت جدید">
          <div className="space-y-4">
            <div className="bg-muted/60 grid grid-cols-2 gap-1 rounded-xl p-1">
              {(
                [
                  { key: 'ABOVE', label: 'بالاتر از' },
                  { key: 'BELOW', label: 'پایین‌تر از' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDirection(key)}
                  className={cn(
                    'rounded-lg py-2 text-xs font-semibold transition-colors',
                    direction === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">قیمت هدف هر گرم (تومان)</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={target ? formatExactAmount(target) : ''}
                onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={
                  currentPrice ? formatExactAmount(String(Math.round(currentPrice))) : '5,000,000'
                }
                className={inputClass}
              />
            </label>
            {currentPrice != null && (
              <p className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
                قیمت فعلی: {formatExactAmount(String(Math.round(currentPrice)))} تومان
              </p>
            )}
            <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
              هر هشدار فقط یک‌بار فایر می‌شود. برای هشدار دوباره، هشدار جدیدی ثبت کنید.
            </p>
            {error && (
              <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {error}
              </p>
            )}
            <Button className="w-full" onClick={submit} disabled={busy || !online}>
              {busy ? 'در حال ثبت…' : 'ثبت هشدار'}
            </Button>
          </div>
        </BottomSheet>
      </CardContent>
    </Card>
  )
}
