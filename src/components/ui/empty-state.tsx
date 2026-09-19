import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from './button'

// ============================================
// Empty State — طراحی اختصاصی با tone برند
// ============================================
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
  /** preview = ویژگی آینده — نشان «به‌زودی» */
  badge?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  badge,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'border-border/60 bg-muted/30 animate-fade-in flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="bg-gold-100 text-gold-600 dark:bg-gold-500/10 dark:text-gold-400 flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-xs text-xs leading-5">{description}</p>
        )}
      </div>
      {badge && (
        <span className="bg-gold-100 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300 rounded-full px-3 py-1 text-[11px] font-medium">
          {badge}
        </span>
      )}
      {action && (
        <Button
          variant="gold"
          size="sm"
          className="mt-1"
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
        </Button>
      )}
    </div>
  )
}
