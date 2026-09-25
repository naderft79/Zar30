// ============================================
// Zar30 - Admin Metric Card (Reusable)
// ============================================
// شاخص عددی/متنی عملیاتی — اعداد با tabular-nums برای تراز ستونی
// ============================================

import { type TablerIcon } from '@tabler/icons-react'
import { cn } from 'cn'
import { toPersianDigits } from '@/lib/utils/format'

type MetricTone = 'default' | 'success' | 'warning' | 'error' | 'gold'

const TONE_CLASSES: Record<MetricTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  gold: 'text-gold-600 dark:text-gold-400',
}

const TONE_ICON_BG: Record<MetricTone, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  gold: 'text-gold-600 dark:text-gold-400',
}

interface AdminMetricProps {
  label: string
  /** مقدار خام — ارقام به فارسی تبدیل می‌شوند؛ متن فارسی دست‌نخورده می‌ماند */
  value: string | number
  icon?: TablerIcon
  tone?: MetricTone
  /** توضیح/زیرمتن اختیاری */
  hint?: string
  /** واحد کوچک کنار مقدار — مثلاً «تومان» یا «گرم» */
  unit?: string
  className?: string
}

export function AdminMetric({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
  unit,
  className,
}: AdminMetricProps) {
  const display = typeof value === 'number' ? toPersianDigits(value) : value
  return (
    <div
      className={cn(
        'bg-card border-border/60 min-w-0 overflow-hidden rounded-xl border p-4 shadow-xs',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        {Icon && (
          <Icon
            aria-hidden="true"
            className={cn('size-5 shrink-0', TONE_ICON_BG[tone])}
            strokeWidth={1.75}
          />
        )}
      </div>
      <p
        className={cn(
          'mt-2 min-w-0 text-lg leading-tight font-bold [overflow-wrap:anywhere] break-words tabular-nums sm:text-xl xl:text-2xl',
          TONE_CLASSES[tone],
        )}
      >
        {display}
        {unit && <span className="text-muted-foreground mr-1 text-xs font-normal">{unit}</span>}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p>}
    </div>
  )
}
