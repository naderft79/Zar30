// ============================================
// Zar30 - Chart Widget — wrapper مشترک نمودارها
// ============================================
// سلکتور بازه + toggle overlay + empty/loading + accessibility
// ============================================

'use client'

import Link from 'next/link'
import { IconDownload } from '@tabler/icons-react'
import { Segmented } from './segmented'
import { cn } from 'cn'

export type ChartRange = '7' | '30' | '90'

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: '7', label: '۷ روز' },
  { value: '30', label: '۳۰ روز' },
  { value: '90', label: '۹۰ روز' },
]

export interface ChartWidgetProps {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  range?: ChartRange
  onRangeChange?: (r: ChartRange) => void
  showOverlay?: boolean
  onOverlayChange?: (v: boolean) => void
  overlayLabel?: string
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
  height?: string
  viewAllHref?: string
  onExportCsv?: () => void
  /** متن توصیفی برای screen reader */
  ariaDescription?: string
  className?: string
  children: React.ReactNode
}

export function ChartWidget({
  title,
  subtitle,
  icon: Icon,
  range,
  onRangeChange,
  showOverlay,
  onOverlayChange,
  overlayLabel = 'دوره قبل',
  loading,
  error,
  empty,
  emptyText = 'داده‌ای برای نمایش نیست',
  height = 'h-56',
  viewAllHref,
  onExportCsv,
  ariaDescription,
  className,
  children,
}: ChartWidgetProps) {
  return (
    <section
      aria-label={title}
      className={cn('border-border/60 bg-card flex flex-col rounded-xl border', className)}
    >
      <header className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className="text-muted-foreground size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-sm font-bold">{title}</h2>
            {subtitle && <p className="text-muted-foreground truncate text-[10px]">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOverlayChange !== undefined && (
            <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-[10px] font-medium">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => onOverlayChange(e.target.checked)}
                className="accent-gold-500 size-3.5 rounded"
              />
              {overlayLabel}
            </label>
          )}
          {range && onRangeChange && (
            <Segmented
              options={RANGE_OPTIONS}
              value={range}
              onChange={onRangeChange}
              ariaLabel="بازه زمانی نمودار"
            />
          )}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              aria-label="خروجی CSV"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconDownload className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-gold-700 hover:text-gold-800 dark:text-gold-300 focus-visible:ring-ring rounded-md px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              مشاهده همه
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 p-4" dir="ltr">
        {loading ? (
          <div className={cn('skeleton-shimmer rounded-lg', height)} aria-busy="true" />
        ) : error ? (
          <div
            className="border-error/30 bg-error/5 flex h-full items-center justify-center rounded-lg border"
            role="alert"
          >
            <p className="text-error px-4 text-xs">{error}</p>
          </div>
        ) : empty ? (
          <div className="border-border flex h-full items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground px-4 text-[11px]">{emptyText}</p>
          </div>
        ) : (
          <figure className={cn('w-full', height)} aria-label={ariaDescription ?? title}>
            {children}
          </figure>
        )}
      </div>
    </section>
  )
}
