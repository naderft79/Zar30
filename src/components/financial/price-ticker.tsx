import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { TrendBadge } from './trend-badge'

// ============================================
// Price Ticker — نوار قیمت لحظه‌ای طلا
// compact برای header داشبورد/معاملات
// ============================================

export interface TickerItem {
  key: string
  label: string
  price: number | string
  changePercent?: number
  unit?: string
}

interface PriceTickerProps {
  items: TickerItem[]
  loading?: boolean
  /** نوار افقی scrollable در موبایل */
  className?: string
}

export function PriceTicker({ items, loading = false, className }: PriceTickerProps) {
  return (
    <div
      data-slot="price-ticker"
      className={cn(
        'bg-card border-border/60 flex items-stretch gap-0 overflow-x-auto rounded-xl border shadow-xs',
        'divide-border/50 divide-x',
        className,
      )}
      role="region"
      aria-label="قیمت‌های لحظه‌ای"
    >
      {items.map((item) => (
        <div key={item.key} className="flex min-w-[140px] flex-1 flex-col gap-1 px-4 py-3">
          <span className="text-muted-foreground text-label whitespace-nowrap">{item.label}</span>
          {loading ? (
            <div className="skeleton-shimmer h-5 w-24 rounded" />
          ) : (
            <FinancialNumber
              value={item.price}
              unit={item.unit ?? 'تومان'}
              size="sm"
              className="text-price whitespace-nowrap"
              unitClassName="text-[10px]"
            />
          )}
          {item.changePercent !== undefined && !loading && (
            <TrendBadge value={item.changePercent} className="mt-0.5" />
          )}
        </div>
      ))}
    </div>
  )
}
