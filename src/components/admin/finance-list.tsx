// ============================================
// Zar30 - Admin Finance List (Generic Client)
// ============================================
// URL query = source of truth؛ search debounce 300ms؛ fetch سرور-محور
// config-محور برای جلوگیری از duplication بین لیست‌های مالی read-only
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiGetWithRefresh } from '@/lib/api/client'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'

export interface FinanceListFilterDef {
  /** کلید query param */
  key: string
  label: string
  options: readonly { value: string; label: string }[]
}

interface AdminFinanceListProps<T> {
  title: string
  eyebrow?: string
  description?: string
  /** مسیر API — مثل /api/v1/admin/orders */
  endpoint: string
  /** کلید آرایه در data پاسخ — مثل orders */
  dataKey: string
  columns: AdminColumn<T>[]
  keyOf: (row: T) => string
  /** لینک «مشاهده جزئیات» — اگر detail route وجود دارد */
  detailHref?: (row: T) => string
  filters?: readonly FinanceListFilterDef[]
  /** نمایش فیلتر بازه زمانی from/to */
  dateRange?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  /** نشان دادن بنر read-only */
  readOnlyNotice?: boolean
}

const selectClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

const inputClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none tabular-nums'

export function AdminFinanceList<T>({
  title,
  eyebrow,
  description,
  endpoint,
  dataKey,
  columns,
  keyOf,
  detailHref,
  filters = [],
  dateRange = false,
  searchPlaceholder = 'جستجو…',
  emptyMessage = 'رکوردی با این فیلترها یافت نشد',
  readOnlyNotice = true,
}: AdminFinanceListProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const q = searchParams.get('q') ?? ''
  const direction = searchParams.get('direction') ?? 'desc'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const filterValues = filters.map((f) => searchParams.get(f.key) ?? '')

  const [searchInput, setSearchInput] = useState(q)
  const [rows, setRows] = useState<T[] | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ q: value, page: '1' }), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // fetch — stale-while-revalidate؛ setState فقط بعد از await
  const filterDeps = filterValues.join('|')
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    params.set('direction', direction)
    if (q) params.set('q', q)
    if (dateRange && from) params.set('from', from)
    if (dateRange && to) params.set('to', to)
    filters.forEach((f, i) => {
      const v = filterValues[i]
      if (v) params.set(f.key, v)
    })
    ;(async () => {
      const res = await apiGetWithRefresh<Record<string, T[]>>(`${endpoint}?${params.toString()}`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setRows([])
        setError(res.error ?? 'بارگذاری داده‌ها ناموفق بود')
        return
      }
      setError(null)
      setRows(res.data?.[dataKey] ?? [])
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, dataKey, page, q, direction, from, to, filterDeps])

  const hasFilters = !!(q || from || to || filterValues.some(Boolean))

  return (
    <div>
      <AdminPageHeader title={title} eyebrow={eyebrow} description={description} />

      {readOnlyNotice && <ReadOnlyNotice className="mb-4" />}

      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        hasActiveFilters={hasFilters}
        onClear={() => {
          setSearchInput('')
          updateParams({
            q: '',
            from: '',
            to: '',
            page: '1',
            ...Object.fromEntries(filters.map((f) => [f.key, ''])),
          })
        }}
      >
        {filters.map((f, i) => (
          <select
            key={f.key}
            aria-label={f.label}
            value={filterValues[i]}
            onChange={(e) => updateParams({ [f.key]: e.target.value, page: '1' })}
            className={selectClass}
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {dateRange && (
          <>
            <label htmlFor="from-date" className="sr-only">
              از تاریخ (UTC)
            </label>
            <input
              id="from-date"
              type="date"
              dir="ltr"
              value={from}
              onChange={(e) => updateParams({ from: e.target.value, page: '1' })}
              className={inputClass}
            />
            <label htmlFor="to-date" className="sr-only">
              تا تاریخ (UTC)
            </label>
            <input
              id="to-date"
              type="date"
              dir="ltr"
              value={to}
              onChange={(e) => updateParams({ to: e.target.value, page: '1' })}
              className={inputClass}
            />
            <span className="text-muted-foreground text-[10px]">بازه زمانی بر مبنای UTC</span>
          </>
        )}
        <select
          aria-label="مرتب‌سازی"
          value={direction}
          onChange={(e) => updateParams({ direction: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="desc">جدیدترین</option>
          <option value="asc">قدیمی‌ترین</option>
        </select>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        rows={rows}
        keyOf={keyOf}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        rowHref={detailHref}
      />

      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
