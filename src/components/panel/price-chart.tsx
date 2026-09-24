// ============================================
// Zar30 - Live Gold Price Chart (Panel Home)
// ============================================
// نمودار لحظه‌ای قیمت طلای ۱۸ عیار — داده واقعی از جدول GoldPrice
// (رکوردهای sync شده providerها) — هیچ داده ساختگی تولید نمی‌شود.
// بازه‌ها: ۲۴ ساعت / ۷ روز / ۳۰ روز + سوییچ نمایش نرخ خرید/فروش
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconChartLine, IconTrendingDown, IconTrendingUp, IconWallet } from '@tabler/icons-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from 'cn'

type RangeKey = '24h' | '7d' | '30d'
type SideKey = 'buy' | 'sell'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '24h', label: '۲۴ ساعت' },
  { key: '7d', label: '۷ روز' },
  { key: '30d', label: '۳۰ روز' },
]

const SIDES: { key: SideKey; label: string }[] = [
  { key: 'buy', label: 'نرخ خرید' },
  { key: 'sell', label: 'نرخ فروش' },
]

interface HistoryPoint {
  t: string
  buy: number
  sell: number
}

interface ChartPoint {
  t: string
  v: number
  label: string
}

// لیبل محور زمان — بازه ۲۴ ساعتی: ساعت، بازه‌های بلند: روز/ماه شمسی
function axisLabel(iso: string, range: RangeKey) {
  const d = new Date(iso)
  if (range === '24h') {
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })
}

// لیبل کامل tooltip — تاریخ شمسی + ساعت
function fullLabel(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PriceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]!.payload
  return (
    <div
      className="border-border/70 bg-card/95 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-sm"
      dir="rtl"
    >
      <p className="text-muted-foreground text-[10px]">{fullLabel(p.t)}</p>
      <p className="text-foreground mt-0.5 text-sm font-bold tabular-nums" dir="ltr">
        {formatExactAmount(String(p.v))}
        <span className="text-muted-foreground mr-1 text-[10px] font-normal">تومان</span>
      </p>
    </div>
  )
}

export function PriceChart() {
  const [range, setRange] = useState<RangeKey>('24h')
  const [side, setSide] = useState<SideKey>('buy')
  const [points, setPoints] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  // بارگذاری اولیه + رفرش خودکار هر ۶۰ ثانیه برای حس «لحظه‌ای»
  // هنگام تعویض بازه داده قبلی تا رسیدن پاسخ جدید نمایش داده می‌شود
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/price/history?range=${range}`)
        const json = (await res.json()) as {
          success: boolean
          data?: { points: HistoryPoint[] }
        }
        if (!cancelled && json.success && json.data) setPoints(json.data.points)
      } catch {
        // خطای شبکه — داده قبلی حفظ می‌شود
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    const timer = setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [range])

  const data: ChartPoint[] = useMemo(
    () => points.map((p) => ({ t: p.t, v: p[side], label: axisLabel(p.t, range) })),
    [points, side, range],
  )

  const first = data[0]?.v ?? 0
  const last = data[data.length - 1]?.v ?? 0
  const change = last - first
  const changePct = first > 0 ? (change / first) * 100 : 0
  const up = change >= 0
  const min = data.length ? Math.min(...data.map((d) => d.v)) : 0
  const max = data.length ? Math.max(...data.map((d) => d.v)) : 0

  // رنگ نمودار بر اساس روند بازه — صعودی سبز/نزولی قرمز با گرادیان نرم
  const stroke = up ? 'var(--color-success)' : 'var(--color-error)'

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconChartLine className="text-gold-600 size-5" stroke={1.75} />
          نمودار لحظه‌ای قیمت طلای ۱۸ عیار
        </CardTitle>
        {/* تب‌های بازه — راست‌چین در ستون دوم هدر */}
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <div
            className="bg-muted/60 inline-flex rounded-lg p-0.5"
            role="tablist"
            aria-label="بازه نمودار"
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs',
                  range === r.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ردیف قیمت فعلی + تغییر + سوییچ خرید/فروش */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {loading && data.length === 0 ? (
              <div className="skeleton-shimmer h-7 w-36 rounded-md" />
            ) : last > 0 ? (
              <>
                <p
                  className="text-foreground text-xl font-extrabold tabular-nums sm:text-2xl"
                  dir="ltr"
                >
                  {formatExactAmount(String(last))}
                  <span className="text-muted-foreground mr-1.5 text-xs font-normal">
                    تومان / گرم
                  </span>
                </p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                    up ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                  )}
                  dir="ltr"
                >
                  {up ? (
                    <IconTrendingUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <IconTrendingDown className="size-3.5" aria-hidden="true" />
                  )}
                  {up ? '+' : '−'}
                  {toPersianDigits(Math.abs(changePct).toFixed(2))}٪
                </span>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">داده کافی برای نمایش نیست</p>
            )}
          </div>

          {/* سوییچ نرخ خرید/فروش */}
          <div
            className="bg-muted/60 inline-flex rounded-lg p-0.5"
            role="tablist"
            aria-label="نوع نرخ"
          >
            {SIDES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={side === s.key}
                onClick={() => setSide(s.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors sm:text-xs',
                  side === s.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* نمودار */}
        {loading && data.length === 0 ? (
          <div className="skeleton-shimmer h-48 rounded-xl sm:h-56" />
        ) : data.length < 2 ? (
          <div className="border-border/50 text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs sm:h-56">
            <IconChartLine className="size-6" stroke={1.5} />
            داده کافی برای رسم نمودار در این بازه ثبت نشده است
          </div>
        ) : (
          <div className="h-48 w-full sm:h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="panel-price-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  strokeOpacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                  reversed
                />
                <YAxis
                  domain={['dataMin - 20000', 'dataMax + 20000']}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  tickFormatter={(v: number) => `${Math.round(v / 100_000) / 10}M`}
                  width={40}
                  axisLine={false}
                  tickLine={false}
                  orientation="right"
                />
                <Tooltip
                  content={<PriceTooltip />}
                  cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={stroke}
                  strokeWidth={2}
                  fill="url(#panel-price-fill)"
                  animationDuration={500}
                  activeDot={{
                    r: 4,
                    fill: stroke,
                    stroke: 'var(--color-card)',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* آمار بازه — کمترین / بیشترین / آخرین */}
        {data.length >= 2 && (
          <div className="border-border/50 flex items-center justify-between border-t pt-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">کمترین</span>
              <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                {formatExactAmount(String(min))}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconWallet className="text-muted-foreground size-3.5" stroke={1.75} />
              <span className="text-muted-foreground">
                {toPersianDigits(data.length)} نقطه قیمت
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">بیشترین</span>
              <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                {formatExactAmount(String(max))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
