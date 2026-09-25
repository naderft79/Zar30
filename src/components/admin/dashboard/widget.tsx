// ============================================
// Zar30 - AdminWidget — wrapper استاندارد ویجت‌های داشبورد
// ============================================
// همه ویجت‌ها: permission gate + header + error/empty/loading مستقل
// ============================================

'use client'

import Link from 'next/link'
import { IconDownload, IconRefresh } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, type Permission } from '@/lib/auth/rbac'
import { cn } from 'cn'

export interface AdminWidgetProps {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  permission?: Permission
  subtitle?: string
  /** لینک «مشاهده همه» در header */
  viewAllHref?: string
  /** دکمه خروجی CSV */
  onExportCsv?: () => void
  onRefresh?: () => void
  loading?: boolean
  error?: string | null
  className?: string
  /** ارتفاع skeleton هنگام loading */
  skeletonHeight?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AdminWidget({
  title,
  icon: Icon,
  permission,
  subtitle,
  viewAllHref,
  onExportCsv,
  onRefresh,
  loading,
  error,
  className,
  skeletonHeight = 'h-32',
  children,
  footer,
}: AdminWidgetProps) {
  const { admin } = useAdmin()

  // gate مجوز — بدون permission ویجت اصلاً رندر نمی‌شود
  if (permission && !hasPermission(admin.permissions, permission)) return null

  return (
    <section
      aria-label={title}
      className={cn('border-border/60 bg-card flex flex-col rounded-xl border', className)}
    >
      <header className="border-border/40 flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className="text-muted-foreground size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-sm font-bold">{title}</h2>
            {subtitle && <p className="text-muted-foreground truncate text-[10px]">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="به‌روزرسانی"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconRefresh className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              aria-label="خروجی CSV"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconDownload className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-gold-700 hover:text-gold-800 dark:text-gold-300 dark:hover:text-gold-200 focus-visible:ring-ring rounded-md px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              مشاهده همه
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 p-4">
        {loading ? (
          <div
            className={cn('skeleton-shimmer rounded-lg', skeletonHeight)}
            aria-busy="true"
            aria-label="در حال بارگذاری"
          />
        ) : error ? (
          <div
            className="border-error/30 bg-error/5 flex flex-col items-start gap-2 rounded-lg border px-4 py-3"
            role="alert"
          >
            <p className="text-error text-xs font-semibold">{error}</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="text-error hover:bg-error/10 focus-visible:ring-ring rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                تلاش مجدد
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <footer className="border-border/40 text-muted-foreground border-t px-4 py-2 text-[10px] tabular-nums">
          {footer}
        </footer>
      )}
    </section>
  )
}
