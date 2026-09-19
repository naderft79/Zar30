import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

// ============================================
// Status Badge — وضعیت‌های دامنه مالی/حساب
// با dot نشانگر برای خوانایی سریع
// ============================================
const statusBadgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        // خنثی — اطلاعات عمومی
        neutral: 'bg-muted text-text-secondary dark:bg-muted/60',
        // طلایی — برند / در انتظار
        gold: 'bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300',
        // موفق — فعال / تکمیل‌شده / تایید
        success: 'bg-success/10 text-success dark:bg-success/15',
        // هشدار — در انتظار اقدام
        warning: 'bg-warning/10 text-warning dark:bg-warning/15',
        // خطا — مسدود / ردشده / ناموفق
        error: 'bg-error/10 text-error dark:bg-error/15',
        // اطلاعاتی — در حال پردازش
        info: 'bg-info/10 text-info dark:bg-info/15',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

const dotTone: Record<string, string> = {
  neutral: 'bg-muted-foreground/60',
  gold: 'bg-gold-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
}

interface StatusBadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof statusBadgeVariants> {
  /** نمایش dot نشانگر */
  dot?: boolean
}

export function StatusBadge({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      className={cn(statusBadgeVariants({ tone }), className)}
      {...props}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', dotTone[tone ?? 'neutral'])} />}
      {children}
    </span>
  )
}
