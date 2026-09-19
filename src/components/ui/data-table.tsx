import { cn } from 'cn'
import { SkeletonListItem } from './skeleton'
import { EmptyState } from './empty-state'
import type { LucideIcon } from 'lucide-react'

// ============================================
// Data Table — جدول مالی قابل توسعه
// Desktop: جدول | Mobile: کارت/لیست responsive
// ============================================

export interface DataTableColumn<T> {
  key: string
  header: string
  /** رندر سلول — در موبایل هم از همین استفاده می‌شود */
  render: (row: T) => React.ReactNode
  /** ستون در موبایل نمایش داده شود؟ (پیش‌فرض: true) */
  showOnMobile?: boolean
  /** ستون اصلی در کارت موبایل (به‌جای label نمایش داده می‌شود) */
  primary?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** کلید یکتا هر ردیف */
  rowKey: (row: T) => string
  loading?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyIcon,
  emptyTitle = 'موردی یافت نشد',
  emptyDescription,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="divide-border/60 divide-y" aria-busy="true" aria-label="در حال بارگذاری">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0]
  if (!primaryCol) return null
  const mobileCols = columns.filter((c) => c.showOnMobile !== false && c !== primaryCol)

  return (
    <>
      {/* Desktop — جدول */}
      <div className={cn('hidden overflow-x-auto md:block', className)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'text-muted-foreground px-4 py-3 text-right text-xs font-medium',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-muted/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — کارت/لیست */}
      <ul className="divide-border/40 divide-y md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="px-1 py-3.5">
            <div className="mb-1.5">{primaryCol.render(row)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {mobileCols.map((col) => (
                <div key={col.key} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground text-[11px]">{col.header}</dt>
                  <dd className="text-xs">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
