// ============================================
// Zar30 - Live Gold Price Chart (Panel Home)
// ============================================
// نمودار قیمت طلای ۱۸ عیار — داده واقعی نرخ پایانی TGJU
// تایم‌فریم‌ها: روزانه / هفتگی / ماهانه — هرکدام ۵۰ رکورد قیمتی
// نقطه طلایی = آخرین قیمت · نقطه‌های min/max با لیبل قیمت ثابت
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconChartLine, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from 'cn'

type RangeKey = 'daily' | 'weekly' | 'monthly'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'daily', label: 'روزانه' },
  { key: 'weekly', label: 'هفتگی' },
  { key: 'monthly', label: 'ماهانه' },
]

interface HistoryPoint {
  t: string
  buy: number
  sell: number
}

interface ChartPoint {
  t: string
  v: number
}

// لیبل محور زمان — روزانه/هفتگی: روز+ماه شمسی، ماهانه: ماه+سال شمسی
function axisLabel(iso: string, range: RangeKey) {
  const d = new Date(iso)
  if (range === 'monthly') {
    return d.toLocaleDateString('fa-IR', { month: 'short', year: 'numeric' })
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

// تیک محور قیمت — direction=rtl صریح تا «م» همیشه سمت راست عدد بنشیند (۲۷٫۸ م)
function PriceAxisTick(props: { x?: number; y?: number; payload?: { value: number } }) {
  const { x = 0, y = 0, payload } = props
  const v = payload?.value ?? 0
  const fa = toPersianDigits((v / 1_000_000).toFixed(1).replace('.', '٫'))
  return (
    <text
      x={x}
      y={y + 3}
      textAnchor="end"
      direction="rtl"
      fill="var(--color-muted-foreground)"
      fontSize={10}
    >
      م {fa}
    </text>
  )
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
  const [range, setRange] = useState<RangeKey>('daily')
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

  const data: ChartPoint[] = useMemo(() => points.map((p) => ({ t: p.t, v: p.buy })), [points])
  // داده رندر: قدیمی‌ترین نقطه سمت چپ → جدیدترین سمت راست (خوانش چپ‌به‌راست)
  const chartData = data

  const first = data[0]?.v ?? 0
  const last = data[data.length - 1]?.v ?? 0
  const change = last - first
  const changePct = first > 0 ? (change / first) * 100 : 0
  const up = change >= 0
  const minPoint = data.length ? data.reduce((a, b) => (b.v < a.v ? b : a)) : undefined
  const maxPoint = data.length ? data.reduce((a, b) => (b.v > a.v ? b : a)) : undefined
  const min = minPoint?.v ?? 0
  const max = maxPoint?.v ?? 0

  // خط چارت سورمه‌ای (رنگ امضای سایت) + نقطه آخر طلایی
  const stroke = 'var(--color-navy-700)'

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
        {/* ردیف قیمت فعلی + تغییر */}
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
          // چارت تمام‌عرض — خروج از padding کارت + حذف هاله/حاشیه لمسی موبایل
          <div
            className="-mx-6 h-48 w-[calc(100%+3rem)] [-webkit-tap-highlight-color:transparent] sm:h-56 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_svg]:outline-none"
            dir="ltr"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, bottom: 8, left: 0 }}>
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
                  dataKey="t"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  tickFormatter={(iso: string) => axisLabel(iso, range)}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  domain={['dataMin - 60000', 'dataMax + 60000']}
                  tick={<PriceAxisTick />}
                  width={44}
                  axisLine={false}
                  tickLine={false}
                  orientation="left"
                />
                <Tooltip
                  content={<PriceTooltip />}
                  cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
                />
                {/* نقطه طلایی آخرین قیمت — جدیدترین نقطه، سمت راست چارت */}
                <ReferenceDot
                  x={chartData[chartData.length - 1]!.t}
                  y={last}
                  r={4}
                  fill="#c9a227"
                  stroke="var(--color-card)"
                  strokeWidth={2}
                />
                {/* بالاترین قیمت تایم‌فریم — نقطه طلایی + لیبل ثابت */}
                {maxPoint && (
                  <ReferenceDot
                    x={maxPoint.t}
                    y={max}
                    r={4}
                    fill="var(--color-success)"
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    label={{
                      value: toPersianDigits(formatExactAmount(String(max))),
                      position: 'top',
                      fill: 'var(--color-success)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                )}
                {/* پایین‌ترین قیمت تایم‌فریم — نقطه قرمز + لیبل ثابت */}
                {minPoint && (
                  <ReferenceDot
                    x={minPoint.t}
                    y={min}
                    r={4}
                    fill="var(--color-error)"
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    label={{
                      value: toPersianDigits(formatExactAmount(String(min))),
                      position: 'insideTopLeft',
                      fill: 'var(--color-error)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={stroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#panel-price-fill)"
                  animationDuration={500}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: stroke,
                    stroke: 'var(--color-card)',
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* آمار بازه — کمترین / بیشترین */}
        {data.length >= 2 && (
          <div className="border-border/50 flex items-center justify-between border-t pt-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">بیشترین بازه</span>
              <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                {formatExactAmount(String(max))}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">کمترین بازه</span>
              <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                {formatExactAmount(String(min))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
