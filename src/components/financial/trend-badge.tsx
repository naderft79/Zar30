import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from 'cn'
import { formatPercentChange } from '@/lib/utils/format'

// ============================================
// Trend Badge — نشانگر سود/زیان با فلش جهت
// سبز = مثبت | قرمز = منفی | خاکستری = خنثی
// ============================================

interface TrendBadgeProps {
  value: number
  /** توضیح کوتاه کنار درصد — مثلاً «۲۴ ساعت اخیر» */
  caption?: string
  className?: string
}

export function TrendBadge({ value, caption, className }: TrendBadgeProps) {
  const positive = value > 0
  const neutral = value === 0
  const Icon = neutral ? TrendingUp : positive ? TrendingUp : TrendingDown

  return (
    <span
      data-slot="trend-badge"
      data-direction={positive ? 'up' : neutral ? 'flat' : 'down'}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        neutral && 'bg-muted text-muted-foreground',
        positive && 'bg-success/10 text-success',
        !positive && !neutral && 'bg-error/10 text-error',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span dir="ltr">{formatPercentChange(value)}</span>
      {caption && <span className="font-normal opacity-70">{caption}</span>}
    </span>
  )
}
