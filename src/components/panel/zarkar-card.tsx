// ============================================
// Zar30 - ZarKar Card (سپرده طلا با سود)
// ============================================
// زرکار — قفل طلا برای ۳/۶/۱۲ ماه و دریافت سود ثابت دوره‌ای به صورت طلا
// سپرده‌گذاری با Idempotency-Key — پرداخت سود توسط کرون امن سمت سرور
// برداشت زودهنگام وجود ندارد — محصول قفل‌شده
// ============================================

'use client'

import { useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconCoins,
  IconLock,
  IconPlus,
  IconTrendingUp,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface ZarkarPlan {
  id: string
  name: string
  durationDays: number
  minGoldGram: string
  rate: string
  periods: number
}

interface ZarkarPosition {
  id: string
  planName: string
  durationDays: number
  rate: string
  goldAmount: string
  status: 'ACTIVE' | 'MATURED' | 'EARLY_CLOSED'
  startDate: string
  endDate: string
  paidCount: number
  totalPaid: string
}

const STATUS_LABELS: Record<string, { label: string; tone: 'success' | 'neutral' | 'gold' }> = {
  ACTIVE: { label: 'فعال', tone: 'success' },
  MATURED: { label: 'تسویه‌شده', tone: 'neutral' },
  EARLY_CLOSED: { label: 'بسته‌شده', tone: 'neutral' },
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface ZarkarCardProps {
  online: boolean
  onChanged?: () => void
}

export function ZarkarCard({ online, onChanged }: ZarkarCardProps) {
  const [plans, setPlans] = useState<ZarkarPlan[]>([])
  const [positions, setPositions] = useState<ZarkarPosition[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const [grams, setGrams] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await apiGetWithRefresh<{ plans: ZarkarPlan[]; positions: ZarkarPosition[] }>(
      '/api/v1/investments',
    )
    if (res.ok) {
      setPlans(res.data?.plans ?? [])
      setPositions(res.data?.positions ?? [])
    }
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{
        plans: ZarkarPlan[]
        positions: ZarkarPosition[]
      }>('/api/v1/investments')
      if (cancelled) return
      if (res.ok) {
        setPlans(res.data?.plans ?? [])
        setPositions(res.data?.positions ?? [])
      }
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedPlan = plans.find((p) => p.id === planId) ?? null
  const gramsNum = Number(grams) || 0
  // سود تخمینی کل دوره = مقدار × نرخ طرح — فقط نمایشی، مقدار واقعی سمت سرور محاسبه می‌شود
  const estimatedYield = selectedPlan ? (gramsNum * Number(selectedPlan.rate)) / 100 : 0

  async function submit() {
    setError(null)
    if (!selectedPlan) {
      setError('یک طرح را انتخاب کنید')
      return
    }
    if (!/^\d+(\.\d{1,6})?$/.test(grams) || gramsNum <= 0) {
      setError('مقدار طلا را به گرم وارد کنید')
      return
    }
    if (gramsNum < Number(selectedPlan.minGoldGram)) {
      setError(`حداقل سپرده این طرح ${selectedPlan.minGoldGram} گرم است`)
      return
    }
    setBusy(true)
    const res = await apiPost(
      '/api/v1/investments',
      { planId: selectedPlan.id, goldGrams: grams },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت سپرده ناموفق بود')
      return
    }
    setSheetOpen(false)
    setGrams('')
    setPlanId(null)
    void load()
    onChanged?.()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconCoins className="text-gold-600 size-5" stroke={1.75} />
          زرکار — سپرده طلا
        </CardTitle>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={!online}
          className="text-gold-600 hover:text-gold-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
        >
          <IconPlus className="size-4" aria-hidden="true" />
          سپرده جدید
        </button>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="skeleton-shimmer h-10 rounded-lg" />
        ) : positions.length === 0 ? (
          <EmptyState
            icon={IconCoins}
            title="سپرده زرکار ندارید"
            description="طلای خود را برای ۳ تا ۱۲ ماه سپرده کنید و سود ثابت به صورت طلا بگیرید."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {positions.map((p) => {
              const meta: { label: string; tone: 'success' | 'neutral' | 'gold' } = STATUS_LABELS[
                p.status
              ] ?? { label: 'فعال', tone: 'success' }
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                      {formatExactAmount(p.goldAmount)}{' '}
                      <span className="text-muted-foreground">گرم · {p.planName}</span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      سود پرداخت‌شده: {formatExactAmount(p.totalPaid)} گرم
                      {' · '}
                      {p.status === 'ACTIVE'
                        ? `سررسید: ${new Date(p.endDate).toLocaleDateString('fa-IR', { dateStyle: 'short' })}`
                        : `تسویه: ${new Date(p.endDate).toLocaleDateString('fa-IR', { dateStyle: 'short' })}`}
                    </p>
                  </div>
                  <StatusBadge tone={meta.tone} dot={false}>
                    {meta.label}
                  </StatusBadge>
                </li>
              )
            })}
          </ul>
        )}

        {/* شیت سپرده جدید */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="سپرده زرکار">
          <div className="space-y-4">
            {/* انتخاب طرح */}
            <div className="space-y-2">
              <span className="text-muted-foreground text-[11px]">مدت سپرده</span>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={cn(
                      'rounded-xl border p-3 text-center transition-colors',
                      planId === p.id
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/30'
                        : 'border-border/60 hover:border-border',
                    )}
                  >
                    <p className="text-foreground text-xs font-bold">{p.name}</p>
                    <p className="text-gold-600 mt-1 flex items-center justify-center gap-0.5 text-[10px] font-semibold">
                      <IconTrendingUp className="size-3" aria-hidden="true" />
                      {p.rate}٪ سود
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">
                مقدار طلا (گرم)
                {selectedPlan ? ` — حداقل ${selectedPlan.minGoldGram}` : ''}
              </span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={grams}
                onChange={(e) => setGrams(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0.5"
                className={inputClass}
              />
            </label>

            {selectedPlan && gramsNum > 0 && (
              <div className="bg-gold-50 dark:bg-gold-950/30 rounded-xl p-3 text-center">
                <p className="text-muted-foreground text-[10px]">سود تخمینی کل دوره</p>
                <p
                  className="text-gold-700 dark:text-gold-400 text-sm font-bold tabular-nums"
                  dir="ltr"
                >
                  ≈ {estimatedYield.toFixed(4)} گرم
                </p>
                <p className="text-muted-foreground mt-0.5 text-[10px]">
                  پرداخت در {selectedPlan.periods} قسط ماهانه
                </p>
              </div>
            )}

            <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
              <IconLock className="text-gold-600 me-1 mb-0.5 inline size-4" aria-hidden="true" />
              طلای شما تا پایان مدت طرح قفل می‌شود و برداشت زودهنگام ممکن نیست. سود هر ۳۰ روز به
              صورت طلا به کیف شما واریز می‌شود.
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
              disabled={busy || !online}
              title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
            >
              {busy ? 'در حال ثبت…' : 'ثبت سپرده'}
            </Button>
          </div>
        </BottomSheet>
      </CardContent>
    </Card>
  )
}
