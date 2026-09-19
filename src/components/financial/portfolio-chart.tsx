import { cn } from 'cn'
import { TrendBadge } from './trend-badge'

// ============================================
// Portfolio Chart — نمودار area مینیمال دارایی
// SVG سبک — بدون وابستگی خارجی
// ============================================

interface PortfolioChartProps {
  /** نقاط داده — ترتیب زمانی */
  data: number[]
  /** درصد تغییر کلی دوره */
  changePercent?: number
  title?: string
  height?: number
  loading?: boolean
  className?: string
}

function buildPath(data: number[], width: number, height: number, pad: number) {
  if (data.length < 2) return { line: '', area: '' }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }))

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const lastX = points[points.length - 1]?.x ?? width - pad
  const area = `${line} L${lastX},${height - pad} L${pad},${height - pad} Z`
  return { line, area }
}

export function PortfolioChart({
  data,
  changePercent,
  title = 'روند دارایی',
  height = 120,
  loading = false,
  className,
}: PortfolioChartProps) {
  const width = 600
  const pad = 8
  const { line, area } = buildPath(data, width, height, pad)
  const trendUp = (changePercent ?? 0) >= 0
  const strokeColor = trendUp ? 'var(--success)' : 'var(--error)'

  return (
    <div
      data-slot="portfolio-chart"
      className={cn('bg-card border-border/60 rounded-xl border p-4 shadow-xs', className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-label">{title}</p>
        {changePercent !== undefined && <TrendBadge value={changePercent} />}
      </div>
      {loading ? (
        <div className="skeleton-shimmer w-full rounded-lg" style={{ height }} />
      ) : data.length < 2 ? (
        <div
          className="text-muted-foreground flex items-center justify-center text-xs"
          style={{ height }}
        >
          داده کافی برای نمایش نمودار وجود ندارد
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
          role="img"
          aria-label={`${title} — ${changePercent !== undefined ? (trendUp ? 'صعودی' : 'نزولی') : ''}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#portfolio-fill)" />
          <path
            d={line}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  )
}
