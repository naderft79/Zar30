import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { Button } from '@/components/ui/button'

// ============================================
// Quote Card — پیش‌فاکتور/برآورد سفارش
// قبل از ثبت نهایی معامله
// ============================================

export interface QuoteRow {
  label: string
  value: number | string
  unit?: string
  /** ردیف اصلی (مبلغ نهایی) — بزرگ‌تر نمایش داده می‌شود */
  total?: boolean
}

interface QuoteCardProps {
  title: string
  rows: QuoteRow[]
  /** زمان اعتبار قیمت — مثلاً «۳۰ ثانیه» */
  expiresIn?: string
  actionLabel?: string
  onAction?: () => void
  loading?: boolean
  className?: string
}

export function QuoteCard({
  title,
  rows,
  expiresIn,
  actionLabel,
  onAction,
  loading = false,
  className,
}: QuoteCardProps) {
  return (
    <div
      data-slot="quote-card"
      className={cn(
        'border-gold-500/25 bg-card overflow-hidden rounded-xl border shadow-sm',
        className,
      )}
    >
      {/* هدر با accent طلایی */}
      <div className="border-gold-500/20 bg-gold-500/5 flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {expiresIn && (
          <span className="text-gold-600 dark:text-gold-400 text-[11px] font-medium" role="timer">
            اعتبار: {expiresIn}
          </span>
        )}
      </div>

      <dl className="divide-border/40 divide-y px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3">
            <dt
              className={cn(
                'text-muted-foreground text-xs',
                row.total && 'text-foreground text-sm font-semibold',
              )}
            >
              {row.label}
            </dt>
            <dd>
              {loading ? (
                <div className="skeleton-shimmer h-5 w-24 rounded" />
              ) : (
                <FinancialNumber
                  value={row.value}
                  unit={row.unit}
                  size={row.total ? 'md' : 'sm'}
                  className={row.total ? 'text-gold-600 dark:text-gold-400' : undefined}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>

      {actionLabel && (
        <div className="px-4 pb-4">
          <Button variant="gold" className="w-full" onClick={onAction} disabled={loading}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
