// ============================================
// Zar30 - KPI Card — کارت شاخص کلیدی با sparkline و تب دوره
// ============================================

'use client'

import Link from 'next/link'
import { IconChevronLeft, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, type Permission } from '@/lib/auth/rbac'
import { Segmented } from './segmented'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

// sparkline ساده — بدون recharts تا باندل اولیه سبک بماند
function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const h = 32
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ')
  const areaPoints = `0,${h} ${points} ${w},${h}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={areaPoints} className="fill-gold-500/15" />
      <polyline
        points={points}
        fill="none"
        className="stroke-gold-500"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type KpiPeriod = '24h' | '7d' | '30d'

export interface KpiCardProps {
  id: string
  label: string
  value: string
  unit?: string
  deltaPct?: string | null
  netChange?: string
  netChangeLabel?: string
  sparkline?: number[]
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  permission?: Permission
  href?: string
  periods?: { value: KpiPeriod; label: string }[]
  activePeriod?: KpiPeriod
  onPeriodChange?: (p: KpiPeriod) => void
  gold?: boolean
}

export function KpiCard({
  label,
  value,
  unit,
  deltaPct,
  netChange,
  netChangeLabel,
  sparkline,
  icon: Icon,
  permission,
  href,
  periods,
  activePeriod,
  onPeriodChange,
  gold,
}: KpiCardProps) {
  const { admin } = useAdmin()
  if (permission && !hasPermission(admin.permissions, permission)) return null

  const delta = deltaPct ? parseFloat(deltaPct) : null
  const deltaPositive = delta !== null && delta >= 0

  const content = (
    <>
      {/* تب انتخاب دوره — بالای کارت */}
      {periods && activePeriod && onPeriodChange && (
        <div className="mb-3">
          <Segmented
            options={periods}
            value={activePeriod}
            onChange={onPeriodChange}
            ariaLabel={`بازه ${label}`}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
          <p
            className={cn(
              'mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl',
              gold ? 'text-gold-700 dark:text-gold-300' : 'text-foreground',
            )}
          >
            {formatExactAmount(value)}
            {unit && <span className="text-muted-foreground mr-1 text-xs font-normal">{unit}</span>}
          </p>
        </div>
        {/* دکمه مشاهده جفت آیکون — کل کارت لینک نیست */}
        <div className="flex items-center gap-1.5">
          {href && (
            <Link
              href={href}
              className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              مشاهده
              <IconChevronLeft className="size-3" strokeWidth={2} aria-hidden="true" />
            </Link>
          )}
          <div className="bg-muted/50 text-muted-foreground rounded-lg p-2">
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>
      </div>

      {(delta !== null || netChange) && (
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          {delta !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold tabular-nums',
                deltaPositive ? 'text-success' : 'text-error',
              )}
            >
              {deltaPositive ? (
                <IconTrendingUp className="size-3" strokeWidth={2} aria-hidden="true" />
              ) : (
                <IconTrendingDown className="size-3" strokeWidth={2} aria-hidden="true" />
              )}
              {toPersianDigits(Math.abs(delta))}٪
            </span>
          )}
          {netChange && (
            <span className="text-muted-foreground tabular-nums">
              {netChangeLabel ?? 'جریان'}: {formatExactAmount(netChange)}
            </span>
          )}
        </div>
      )}

      {/* مینی چارت — ناحیه با ارتفاع ثابت تا کارت‌ها و چارت‌ها هم‌تراز بمانند */}
      <div className="mt-auto h-10 w-full">
        {sparkline && sparkline.length >= 2 && (
          <MiniSparkline data={sparkline} className="mt-2 h-8 w-full" />
        )}
      </div>
    </>
  )

  return (
    <div className="border-border/60 bg-card flex h-full flex-col rounded-xl border p-4">
      {content}
      {sparkline && sparkline.length >= 2 && (
        <span className="sr-only">روند ۷ روز: {sparkline.map(toPersianDigits).join('، ')}</span>
      )}
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="border-border/60 bg-card rounded-xl border p-4" aria-busy="true">
      <div className="skeleton-shimmer h-3 w-20 rounded" />
      <div className="skeleton-shimmer mt-2 h-6 w-32 rounded" />
      <div className="skeleton-shimmer mt-3 h-8 w-full rounded" />
    </div>
  )
}
