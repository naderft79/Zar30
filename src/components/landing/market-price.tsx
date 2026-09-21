// ============================================
// Zar30 - Gold Market Section (Landing)
// ============================================
// مینی ترمینال قیمت طلا — قیمت جاری + تغییر + نمودار
// + انتخاب بازه (روزانه/ماهانه/سالانه)
// داده فعلی Demo است و UI صریحاً اعلام می‌کند (no-fake-data)
// ============================================

'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GoldPrice } from '@/lib/price/types'
import { toPersianDigits, formatRial } from '@/lib/utils/utils'
import { cn } from 'cn'

type Range = 'daily' | 'monthly' | 'yearly'

const RANGES: { key: Range; label: string; points: number; stepLabel: string }[] = [
  { key: 'daily', label: 'روزانه', points: 24, stepLabel: 'ساعت' },
  { key: 'monthly', label: 'ماهانه', points: 30, stepLabel: 'روز' },
  { key: 'yearly', label: 'سالانه', points: 12, stepLabel: 'ماه' },
]

// سری نمایشی قطعی (deterministic) — بدون تصادفِ بین رندرها
// فقط برای حالت Demo؛ پس از اتصال منبع واقعی حذف می‌شود
function buildDemoSeries(range: Range, basePrice: number) {
  const config = RANGES.find((r) => r.key === range)!
  const seed = range === 'daily' ? 7 : range === 'monthly' ? 13 : 29
  const points: { i: number; p: number }[] = []
  let value = basePrice * 0.965
  for (let i = 0; i < config.points; i++) {
    const wave = Math.sin((i + seed) * 0.7) * 18_000 + Math.cos((i + seed) * 0.28) * 26_000
    value += wave
    points.push({ i, p: Math.round(value / 1000) * 1000 })
  }
  // پایان سری = قیمت جاری نمایشی
  points[points.length - 1]!.p = basePrice
  return points
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { p: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border-navy-100 text-navy-900 rounded-lg border bg-white px-3 py-2 text-xs font-semibold tabular-nums shadow-md">
      {toPersianDigits(formatRial(payload[0]!.p))} ریال
    </div>
  )
}

export function GoldMarketSection({ initialPrice }: { initialPrice: GoldPrice }) {
  const [range, setRange] = useState<Range>('monthly')
  const base = initialPrice.buyPrice

  const data = useMemo(() => buildDemoSeries(range, base), [range, base])
  const first = data[0]!.p
  const change = base - first
  const changePercent = (change / first) * 100
  const up = change >= 0

  const config = RANGES.find((r) => r.key === range)!

  return (
    <section id="price" className="bg-cream-50 py-16 sm:py-20" aria-labelledby="market-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-gold-600 mb-2 text-sm font-semibold">بازار طلا</p>
          <h2 id="market-title" className="text-navy-950 text-2xl font-bold sm:text-3xl">
            قیمت طلا را دنبال کنید
          </h2>
          <p className="text-navy-500 mx-auto mt-3 max-w-xl text-sm leading-7 sm:text-[15px]">
            قیمت خرید و فروش طلای ۱۸ عیار به‌صورت شفاف نمایش داده می‌شود — بدون هزینه پنهان.
          </p>
        </div>

        <div className="border-navy-100/90 mx-auto max-w-4xl rounded-2xl border bg-white p-4 shadow-[0_18px_44px_-20px_rgb(16_29_56/0.16)] sm:p-6">
          {/* سربرگ — قیمت + بازه */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p
                  className="text-navy-950 text-xl font-extrabold tabular-nums sm:text-2xl"
                  dir="ltr"
                >
                  {toPersianDigits(formatRial(base))}
                  <span className="text-navy-400 mr-1.5 text-xs font-normal">ریال / گرم</span>
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-semibold tabular-nums',
                      up ? 'text-success' : 'text-error',
                    )}
                    dir="ltr"
                  >
                    {up ? (
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-3.5" aria-hidden="true" />
                    )}
                    {up ? '+' : '−'}
                    {toPersianDigits(Math.abs(changePercent).toFixed(2))}٪
                  </span>
                  <span className="text-navy-400">در بازه {config.label.toLowerCase()}</span>
                  {!initialPrice.isLive && (
                    <span className="border-warning/40 bg-warning/5 text-warning inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium">
                      <AlertCircle className="size-3" aria-hidden="true" />
                      داده نمایشی
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* انتخاب بازه */}
            <div
              className="bg-cream-50 border-navy-100/80 inline-flex rounded-lg border p-1"
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
                    'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors',
                    range === r.key
                      ? 'text-navy-950 bg-white shadow-xs'
                      : 'text-navy-500 hover:text-navy-800',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* نمودار — ترمینال مالی مینیمال */}
          <div className="h-56 w-full sm:h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="zar-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a227" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#c9a227" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis
                  domain={['dataMin - 40000', 'dataMax + 40000']}
                  tick={{ fill: '#5a76ad', fontSize: 10 }}
                  tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`}
                  width={44}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#c7d4e8' }} />
                <Area
                  type="monotone"
                  dataKey="p"
                  stroke="#c9a227"
                  strokeWidth={2.5}
                  fill="url(#zar-chart-fill)"
                  animationDuration={600}
                  activeDot={{ r: 4, fill: '#c9a227', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-navy-400 mt-3 text-center text-[11px] leading-5">
            نمودار و قیمت در حالت توسعه از داده نمایشی استفاده می‌کنند؛ پس از اتصال منبع قیمت واقعی،
            به‌صورت خودکار فعال می‌شوند.
          </p>
        </div>
      </div>
    </section>
  )
}
