// ============================================
// Zar30 - Dashboard Charts V2 (recharts)
// ============================================
// همه نمودارهای داشبورد در یک باندل lazy — fetch از /dashboard/charts
// سری اصلی + overlay دوره قبل + drill-down با کلیک
// ============================================

'use client'

import { useRouter } from 'next/navigation'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  IconChartArea,
  IconChartBar,
  IconChartDonut,
  IconChartLine,
  IconCoins,
  IconFlame,
  IconUserCheck,
} from '@tabler/icons-react'
import { ChartWidget, type ChartRange } from './chart-widget'
import type { DashboardCharts } from '@/lib/services/admin-dashboard.service'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

const faDay = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' })
const faTime = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' })

function dayLabel(iso: string): string {
  return faDay.format(new Date(`${iso}T00:00:00`))
}

function toMillion(v: number): number {
  return Math.round(v / 100_000) / 10
}

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  fontSize: '11px',
  direction: 'rtl' as const,
  color: 'var(--foreground)',
}

// ============================================
// ۱. نمودار اصلی — حجم تراکنش + سفارش + کاربر (Composed)
// ============================================

export function VolumeChart({
  data,
  range,
  onRangeChange,
  overlay,
  onOverlayChange,
  loading,
  error,
}: {
  data: DashboardCharts['daily'] | null
  range: ChartRange
  onRangeChange: (r: ChartRange) => void
  overlay: boolean
  onOverlayChange: (v: boolean) => void
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  const rows = (data ?? []).map((d) => ({
    day: dayLabel(d.day),
    isoDay: d.day,
    volume: toMillion(d.txVolume),
    prevVolume: d.prevTxVolume !== null ? toMillion(d.prevTxVolume) : undefined,
    orders: d.orders,
    prevOrders: d.prevOrders ?? undefined,
    users: d.newUsers,
  }))

  return (
    <ChartWidget
      id="chart-volume"
      title="حجم تراکنش و فعالیت روزانه"
      subtitle="تراکنش‌های موفق (میلیون تومان) + سفارش تکمیل‌شده"
      icon={IconChartArea}
      range={range}
      onRangeChange={onRangeChange}
      showOverlay={overlay}
      onOverlayChange={onOverlayChange}
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      height="h-64"
      viewAllHref="/admin/transactions"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          onClick={(state) => {
            const idx = state?.activeTooltipIndex
            const day = typeof idx === 'number' ? rows[idx]?.isoDay : undefined
            if (day) router.push(`/admin/transactions?from=${day}&to=${day}`)
          }}
        >
          <defs>
            <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--gold-500)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(1, Math.floor(rows.length / 8))}
          />
          <YAxis
            yAxisId="vol"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <YAxis
            yAxisId="cnt"
            orientation="right"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string, name: string) => {
              const labels: Record<string, string> = {
                volume: 'حجم (میلیون تومان)',
                prevVolume: 'دوره قبل (میلیون تومان)',
                orders: 'سفارش تکمیل‌شده',
                prevOrders: 'سفارش دوره قبل',
                users: 'کاربر جدید',
              }
              return [toPersianDigits(value), labels[name] ?? name]
            }}
            labelFormatter={(label) => `روز: ${label}`}
          />
          <Area
            yAxisId="vol"
            type="monotone"
            dataKey="volume"
            stroke="var(--gold-500)"
            strokeWidth={2}
            fill="url(#volFill)"
            name="volume"
          />
          {overlay && (
            <Line
              yAxisId="vol"
              type="monotone"
              dataKey="prevVolume"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              name="prevVolume"
            />
          )}
          <Bar
            yAxisId="cnt"
            dataKey="orders"
            fill="var(--navy-400)"
            radius={[3, 3, 0, 0]}
            maxBarSize={12}
            opacity={0.7}
            name="orders"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <figcaption className="sr-only">
        روند روزانه حجم تراکنش و تعداد سفارش‌های تکمیل‌شده
      </figcaption>
    </ChartWidget>
  )
}

// ============================================
// ۲. قیمت طلا
// ============================================

export function GoldPriceChart({
  data,
  loading,
  error,
}: {
  data: DashboardCharts['goldPriceSeries'] | null
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  const rows = (data ?? []).map((g) => ({
    t: g.t,
    label: faTime.format(new Date(g.t)),
    buy: toMillion(g.buy),
    sell: toMillion(g.sell),
  }))

  return (
    <ChartWidget
      id="chart-gold-price"
      title="روند قیمت طلا"
      subtitle="خرید/فروش — میلیون تومان"
      icon={IconChartLine}
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyText="قیمتی در این بازه ثبت نشده"
      height="h-52"
      viewAllHref="/admin/pricing"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          onClick={() => router.push('/admin/pricing')}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(1, Math.floor(rows.length / 6))}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string, name: string) => [
              `${toPersianDigits(value)} میلیون`,
              name === 'buy' ? 'خرید' : 'فروش',
            ]}
            labelFormatter={(label) => `ساعت: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="buy"
            stroke="var(--gold-500)"
            strokeWidth={2}
            dot={false}
            name="buy"
          />
          <Line
            type="monotone"
            dataKey="sell"
            stroke="var(--navy-400)"
            strokeWidth={1.5}
            dot={false}
            name="sell"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  )
}

// ============================================
// ۳. درآمد کارمزد روزانه
// ============================================

export function FeeRevenueChart({
  data,
  overlay,
  loading,
  error,
}: {
  data: DashboardCharts['daily'] | null
  overlay: boolean
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  const rows = (data ?? []).map((d) => ({
    day: dayLabel(d.day),
    isoDay: d.day,
    fee: toMillion(d.feeRevenue),
    prevFee: d.prevFeeRevenue !== null ? toMillion(d.prevFeeRevenue) : undefined,
  }))

  return (
    <ChartWidget
      id="chart-fee"
      title="درآمد کارمزد روزانه"
      subtitle="از دفتر کل — REVENUE_* (میلیون تومان)"
      icon={IconChartBar}
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      height="h-52"
      viewAllHref="/admin/transactions?type=FEE"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          onClick={(state) => {
            const idx = state?.activeTooltipIndex
            const day = typeof idx === 'number' ? rows[idx]?.isoDay : undefined
            if (day) router.push(`/admin/transactions?from=${day}&to=${day}`)
          }}
        >
          <defs>
            <linearGradient id="feeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(1, Math.floor(rows.length / 6))}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string, name: string) => [
              `${toPersianDigits(value)} میلیون تومان`,
              name === 'fee' ? 'درآمد' : 'دوره قبل',
            ]}
          />
          <Area
            type="monotone"
            dataKey="fee"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#feeFill)"
            name="fee"
          />
          {overlay && (
            <Line
              type="monotone"
              dataKey="prevFee"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              name="prevFee"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWidget>
  )
}

// ============================================
// ۴. Donut — سهم assetها
// ============================================

const ASSET_LABEL: Record<string, string> = { TOMAN: 'تومان', GOLD: 'طلا', SILVER: 'نقره' }
const ASSET_COLORS = ['var(--gold-500)', 'var(--navy-400)', 'var(--info)', 'var(--success)']

export function AssetDonut({
  data,
  loading,
  error,
}: {
  data: DashboardCharts['assetShare'] | null
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  const rows = (data ?? [])
    .map((a) => ({
      name: ASSET_LABEL[a.asset] ?? a.asset,
      value: Number(a.balance),
      asset: a.asset,
    }))
    .filter((a) => a.value > 0)
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <ChartWidget
      id="chart-assets"
      title="توزیع دارایی کاربران"
      subtitle={`مجموع: ${formatExactAmount(String(total))} تومان`}
      icon={IconChartDonut}
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      height="h-52"
      viewAllHref="/admin/wallets"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            strokeWidth={0}
            onClick={() => router.push('/admin/wallets')}
            className="cursor-pointer"
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string) => [
              `${formatExactAmount(String(value))} تومان`,
              'مانده',
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div dir="rtl" className="mt-1 flex flex-wrap justify-center gap-3">
        {rows.map((r, i) => (
          <span key={r.name} className="text-muted-foreground flex items-center gap-1 text-[10px]">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }}
            />
            {r.name} — {toPersianDigits(Math.round((r.value / total) * 100))}٪
          </span>
        ))}
      </div>
    </ChartWidget>
  )
}

// ============================================
// ۵. Funnel KYC — بدون کتابخانه، div سفارشی
// ============================================

const KYC_STAGE_LABEL: Record<string, string> = {
  SUBMITTED: 'ثبت‌شده',
  UNDER_REVIEW: 'در حال بررسی',
  APPROVED: 'تاییدشده',
  REJECTED: 'ردشده/نیازمند اصلاح',
}

const KYC_STAGE_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-info',
  UNDER_REVIEW: 'bg-warning',
  APPROVED: 'bg-success',
  REJECTED: 'bg-error',
}

export function KycFunnel({
  data,
  loading,
  error,
}: {
  data: DashboardCharts['kycFunnel'] | null
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  const stages = data ?? []
  const max = Math.max(...stages.map((s) => s.count), 1)

  return (
    <ChartWidget
      id="chart-kyc"
      title="قیف احراز هویت"
      icon={IconUserCheck}
      loading={loading}
      error={error}
      empty={!loading && !error && stages.every((s) => s.count === 0)}
      height="h-52"
      viewAllHref="/admin/kyc"
    >
      <div dir="rtl" className="flex h-full flex-col justify-center gap-2">
        {stages.map((s) => {
          const pct = Math.max((s.count / max) * 100, s.count > 0 ? 8 : 2)
          return (
            <button
              key={s.stage}
              type="button"
              onClick={() => router.push(`/admin/kyc?status=${s.stage}`)}
              className="focus-visible:ring-ring group flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="text-muted-foreground w-24 shrink-0 text-right text-[10px] font-medium">
                {KYC_STAGE_LABEL[s.stage] ?? s.stage}
              </span>
              <span className="bg-muted relative h-6 flex-1 overflow-hidden rounded-md">
                <span
                  className={cn(
                    'absolute inset-y-0 right-0 rounded-md transition-[width] duration-500',
                    KYC_STAGE_COLOR[s.stage] ?? 'bg-navy-400',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="text-foreground w-10 shrink-0 text-left text-xs font-bold tabular-nums">
                {toPersianDigits(s.count)}
              </span>
            </button>
          )
        })}
      </div>
    </ChartWidget>
  )
}

// ============================================
// ۶. Heatmap ساعات اوج — grid ۷×۲۴ سفارشی
// ============================================

const WEEKDAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

export function PeakHeatmap({
  data,
  loading,
  error,
}: {
  data: DashboardCharts['peakHours'] | null
  loading?: boolean
  error?: string | null
}) {
  const router = useRouter()
  // نگاشت ISODOW (۱=دوشنبه…۷=یکشنبه) به تقویم ایران (شنبه=۰)
  const cell = new Map<string, number>()
  let max = 0
  for (const p of data ?? []) {
    const faDayIdx = (p.weekday + 1) % 7 // شنبه=۰ … جمعه=۶
    const key = `${faDayIdx}:${p.hour}`
    cell.set(key, p.count)
    if (p.count > max) max = p.count
  }

  const intensity = (n: number) => {
    if (n === 0 || max === 0) return 'bg-muted'
    const r = n / max
    if (r > 0.75) return 'bg-gold-500'
    if (r > 0.5) return 'bg-gold-500/70'
    if (r > 0.25) return 'bg-gold-500/40'
    return 'bg-gold-500/20'
  }

  return (
    <ChartWidget
      id="chart-heatmap"
      title="ساعات اوج تراکنش"
      subtitle="بر اساس تراکنش موفق در بازه انتخابی"
      icon={IconFlame}
      loading={loading}
      error={error}
      empty={!loading && !error && max === 0}
      height="h-52"
      viewAllHref="/admin/transactions"
    >
      <div dir="rtl" className="flex h-full flex-col justify-center gap-0.5 overflow-x-auto">
        {WEEKDAYS_FA.map((day, di) => (
          <div key={day} className="flex items-center gap-0.5">
            <span className="text-muted-foreground w-14 shrink-0 text-[9px]">{day}</span>
            <div className="flex flex-1 gap-px">
              {Array.from({ length: 24 }).map((_, h) => {
                const n = cell.get(`${di}:${h}`) ?? 0
                return (
                  <button
                    key={h}
                    type="button"
                    title={`${day} ساعت ${toPersianDigits(h)}:۰۰ — ${toPersianDigits(n)} تراکنش`}
                    aria-label={`${day} ساعت ${toPersianDigits(h)} — ${toPersianDigits(n)} تراکنش`}
                    onClick={() => router.push('/admin/transactions')}
                    className={cn(
                      'focus-visible:ring-ring h-4 min-w-1.5 flex-1 rounded-[3px] transition-transform hover:scale-110 focus-visible:ring-1 focus-visible:outline-none',
                      intensity(n),
                    )}
                  />
                )
              })}
            </div>
          </div>
        ))}
        <div className="text-muted-foreground mt-1 flex justify-between text-[8px] tabular-nums">
          <span>۰</span>
          <span>۶</span>
          <span>۱۲</span>
          <span>۱۸</span>
          <span>۲۳</span>
        </div>
      </div>
    </ChartWidget>
  )
}

// ============================================
// ۷. درآمد per کانال — BarChart
// ============================================

export function RevenueByTypeChart({
  data,
  loading,
  error,
}: {
  data: DashboardCharts['revenueByType'] | null
  loading?: boolean
  error?: string | null
}) {
  const rows = (data ?? []).map((r) => ({
    name: r.label,
    amount: toMillion(Number(r.amount)),
    code: r.code,
  }))

  return (
    <ChartWidget
      id="chart-revenue"
      title="درآمد به تفکیک نوع"
      subtitle="میلیون تومان — دوره انتخاب‌شده"
      icon={IconCoins}
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      height="h-52"
      viewAllHref="/admin/financial"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | string) => [
              `${toPersianDigits(value)} میلیون تومان`,
              'درآمد',
            ]}
          />
          <Bar dataKey="amount" fill="var(--gold-500)" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  )
}

// ============================================
// ChartsSection — wrapper lazy برای همه نمودارها
// ============================================

import { useMemo } from 'react'

export function ChartsSection({
  charts,
  range,
  onRangeChange,
  overlay,
  onOverlayChange,
}: {
  charts: DashboardCharts | null
  range: ChartRange
  onRangeChange: (r: ChartRange) => void
  overlay: boolean
  onOverlayChange: (v: boolean) => void
}) {
  const loading = charts === null
  const daily = charts?.daily ?? null
  const gold = charts?.goldPriceSeries ?? null
  const assets = charts?.assetShare ?? null
  const kyc = charts?.kycFunnel ?? null
  const peak = charts?.peakHours ?? null
  const revenue = charts?.revenueByType ?? null

  // داده overlay فقط برای نمودار اصلی و fee
  const dailyWithOverlay = useMemo(() => {
    if (!daily) return null
    return daily
  }, [daily])

  return (
    <div className="space-y-4">
      {/* نمودار اصلی — full width */}
      <VolumeChart
        data={dailyWithOverlay}
        range={range}
        onRangeChange={onRangeChange}
        overlay={overlay}
        onOverlayChange={onOverlayChange}
        loading={loading}
      />
      {/* نمودارهای ثانویه — ۲ ستونه روی xl */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GoldPriceChart data={gold} loading={loading} />
        <FeeRevenueChart data={dailyWithOverlay} overlay={overlay} loading={loading} />
        <AssetDonut data={assets} loading={loading} />
        <KycFunnel data={kyc} loading={loading} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PeakHeatmap data={peak} loading={loading} />
        <RevenueByTypeChart data={revenue} loading={loading} />
      </div>
    </div>
  )
}
