// ============================================
// Zar30 - Savings Plan Card (خرید خودکار طلا)
// ============================================
// پس‌انداز خودکار — روزانه/هفتگی/ماهانه خرید طلا از موجودی تومانی
// ایجاد، فعال/غیرفعال، حذف — اجرا توسط کرون امن سمت سرور
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconPigMoney, IconPlus, IconTrash } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiGetWithRefresh, apiPost, apiPatch, apiDelete } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface SipPlan {
  id: string
  tomanAmount: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  active: boolean
  nextRunAt: string
  lastRunAt: string | null
  lastError: string | null
}

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'روزانه',
  WEEKLY: 'هفتگی',
  MONTHLY: 'ماهانه',
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface SipCardProps {
  online: boolean
  onChanged?: () => void
}

export function SipCard({ online, onChanged }: SipCardProps) {
  const [plans, setPlans] = useState<SipPlan[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await apiGetWithRefresh<{ plans: SipPlan[] }>('/api/v1/savings-plans')
    if (res.ok) setPlans(res.data?.plans ?? [])
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ plans: SipPlan[] }>('/api/v1/savings-plans')
      if (cancelled) return
      if (res.ok) setPlans(res.data?.plans ?? [])
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function submit() {
    setError(null)
    if (!/^\d+$/.test(amount) || Number(amount) < 100_000) {
      setError('حداقل مبلغ هر اجرا ۱۰۰ هزار تومان است')
      return
    }
    setBusy(true)
    const res = await apiPost('/api/v1/savings-plans', { tomanAmount: amount, frequency })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت طرح ناموفق بود')
      return
    }
    setSheetOpen(false)
    setAmount('')
    void load()
    onChanged?.()
  }

  async function toggle(plan: SipPlan) {
    const res = await apiPatch(`/api/v1/savings-plans/${plan.id}`, { active: !plan.active })
    if (res.ok) void load()
  }

  async function remove(id: string) {
    const res = await apiDelete(`/api/v1/savings-plans/${id}`)
    if (res.ok) void load()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconPigMoney className="text-gold-600 size-5" stroke={1.75} />
          خرید خودکار طلا
        </CardTitle>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={!online}
          className="text-gold-600 hover:text-gold-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
        >
          <IconPlus className="size-4" aria-hidden="true" />
          طرح جدید
        </button>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="skeleton-shimmer h-10 rounded-lg" />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={IconPigMoney}
            title="طرح خرید خودکار ندارید"
            description="هر هفته یا هر ماه به‌صورت خودکار مقداری طلا بخرید — پس‌انداز بدون فراموشی."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(p.tomanAmount)}{' '}
                    <span className="text-muted-foreground">
                      تومان · {FREQ_LABELS[p.frequency]}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">
                    اجرای بعدی:{' '}
                    {new Date(p.nextRunAt).toLocaleDateString('fa-IR', { dateStyle: 'short' })}
                    {p.lastError && ' · آخرین اجرا ناموفق'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone={p.active ? 'success' : 'neutral'} dot={false}>
                    {p.active ? 'فعال' : 'متوقف'}
                  </StatusBadge>
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={!online}
                    className="text-muted-foreground hover:text-foreground text-[10px] font-semibold transition-colors"
                  >
                    {p.active ? 'توقف' : 'فعال‌سازی'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={!online}
                    aria-label="حذف طرح"
                    className="text-muted-foreground hover:text-error transition-colors"
                  >
                    <IconTrash className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* شیت طرح جدید */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="طرح خرید خودکار">
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">
                مبلغ هر اجرا (تومان) — حداقل ۱۰۰,۰۰۰
              </span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={amount ? formatExactAmount(amount) : ''}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="500,000"
                className={inputClass}
              />
            </label>
            <div className="bg-muted/60 grid grid-cols-3 gap-1 rounded-xl p-1">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'rounded-lg py-2 text-xs font-semibold transition-colors',
                    frequency === f
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
              در هر سررسید، از موجودی تومانی شما به همان مبلغ طلا خریداری می‌شود. اگر موجودی کافی
              نباشد آن اجرا ناموفق ثبت می‌شود و پس از چند شکست پیاپی طرح متوقف می‌شود.
            </p>
            {error && (
              <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {error}
              </p>
            )}
            <Button className="w-full" onClick={submit} disabled={busy || !online}>
              {busy ? 'در حال ثبت…' : 'ایجاد طرح'}
            </Button>
          </div>
        </BottomSheet>
      </CardContent>
    </Card>
  )
}
