import { cn } from 'cn'

// ============================================
// Page Header — سلسله‌مراتب بالای هر صفحه پنل
// ============================================

interface PageHeaderProps {
  title: string
  description?: string
  /** اکشن سمت چپ (در RTL انتهای ردیف) */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-h1 text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
