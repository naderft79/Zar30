// ============================================
// Zar30 - Admin Data Table (Reusable, Presentational)
// ============================================
// Desktop: جدول semantic با th scope — Mobile: کارت‌های لیستی
// rows از قبل paginated هستند؛ pagination جدا (AdminPagination)
// ============================================

'use client'

import Link from 'next/link'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { cn } from 'cn'

export interface AdminColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
  /** در کارت موبایل نمایش داده شود — پیش‌فرض true */
  mobile?: boolean
}

interface AdminDataTableProps<T> {
  columns: readonly AdminColumn<T>[]
  rows: T[] | null
  keyOf: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  /** لینک «مشاهده جزئیات» native — به‌جای tr قابل‌کلیک */
  rowHref?: (row: T) => string
}

export function AdminDataTable<T>({
  columns,
  rows,
  keyOf,
  loading,
  error,
  emptyMessage = 'رکوردی یافت نشد',
  rowHref,
}: AdminDataTableProps<T>) {
  if (error) {
    return (
      <div
        role="alert"
        className="border-error/30 bg-error/5 text-error flex items-center gap-2 rounded-xl border p-4 text-xs"
      >
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </div>
    )
  }

  if (loading || !rows) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری جدول" className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        {emptyMessage}
      </div>
    )
  }

  const mobileColumns = columns.filter((c) => c.mobile !== false)

  return (
    <>
      {/* ===== Desktop — semantic table ===== */}
      <div className="border-border/60 hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 bg-muted/40 border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'text-muted-foreground px-4 py-3 text-right text-[11px] font-semibold whitespace-nowrap',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {rowHref && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">اقدامات</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyOf(row)}
                className="border-border/40 hover:bg-muted/30 border-b transition-colors last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
                {rowHref && (
                  <td className="px-4 py-3 text-left">
                    <Link
                      href={rowHref(row)}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      مشاهده جزئیات
                      <ChevronLeft className="size-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile — کارت‌های لیستی ===== */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={keyOf(row)} className="bg-card border-border/60 rounded-xl border p-4 shadow-xs">
            <dl className="space-y-2">
              {mobileColumns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0 text-[11px]">{col.header}</dt>
                  <dd className="text-foreground min-w-0 truncate text-xs">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
            {rowHref && (
              <Link
                href={rowHref(row)}
                className="border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring mt-3 flex h-9 items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                مشاهده جزئیات
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
