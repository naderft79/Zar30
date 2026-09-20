// ============================================
// Zar30 - Admin Metric Card (Reusable)
// ============================================
// شاخص عددی/متنی عملیاتی — اعداد با tabular-nums برای تراز ستونی
// ============================================

import type { LucideIcon } from 'lucide-react'
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
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
}

interface AdminMetricProps {
  label: string
  /** مقدار خام — ارقام به فارسی تبدیل می‌شوند؛ متن فارسی دست‌نخورده می‌ماند */
  value: string | number
  icon?: LucideIcon
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
    <div className={cn('bg-card border-border/60 rounded-xl border p-4 shadow-xs', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        {Icon && (
          <span
            aria-hidden="true"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              TONE_ICON_BG[tone],
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className={cn('mt-2 text-xl font-bold tabular-nums sm:text-2xl', TONE_CLASSES[tone])}>
        {display}
        {unit && <span className="text-muted-foreground mr-1 text-xs font-normal">{unit}</span>}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p>}
    </div>
  )
}
