// ============================================
// Zar30 - Admin Page Header (Reusable)
// ============================================
// عنوان استاندارد صفحات عملیاتی — title/description/actions/eyebrow اختیاری
// ============================================

import { cn } from 'cn'

interface AdminPageHeaderProps {
  title: string
  description?: string
  /** برچسب کوتاه بالای عنوان — مثلاً نام section */
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide">
            {eyebrow}
          </p>
        )}
        <h1 className="text-foreground text-xl font-bold sm:text-2xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 max-w-2xl text-xs sm:text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
