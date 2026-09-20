// ============================================
// Zar30 - Admin Pricing History (Client)
// ============================================
// آخرین قیمت + تاریخچه GoldPrice — read-only؛ بدون UI به‌روزرسانی قیمت
// source demo/mock → badge «داده توسعه/نمایشی»
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminPriceListRow } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminMetric } from '@/components/admin/admin-metric'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import { FinancialValue } from '@/components/admin/financial-value'
import { formatExactAmount } from '@/lib/utils/format'
import { TrendingUp } from 'lucide-react'

const DEMO_SOURCE = /mock|demo/i

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-foreground text-xs" dir="ltr">
        {source}
      </span>
      {DEMO_SOURCE.test(source) && (
        <span className="border-warning/30 bg-warning/10 text-warning rounded-md border px-1.5 py-0.5 text-[10px]">
          داده توسعه/نمایشی
        </span>
      )}
    </span>
  )
}

const columns: AdminColumn<AdminPriceListRow>[] = [
  {
    key: 'buy',
    header: 'قیمت خرید',
    render: (p) => <FinancialValue value={p.buyPrice} unit="ریال" />,
  },
  {
    key: 'sell',
    header: 'قیمت فروش',
    render: (p) => <FinancialValue value={p.sellPrice} unit="ریال" />,
  },
  {
    key: 'spread',
    header: 'اسپرد',
    render: (p) => <FinancialValue value={p.spread} />,
  },
  {
    key: 'source',
    header: 'منبع',
    render: (p) => <SourceBadge source={p.source} />,
  },
  {
    key: 'recordedAt',
    header: 'زمان ثبت',
    render: (p) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(p.recordedAt).toLocaleString('fa-IR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </span>
    ),
  },
]

const selectClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

export function AdminPricingClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const source = searchParams.get('source') ?? ''
  const direction = searchParams.get('direction') ?? 'desc'

  const [searchInput, setSearchInput] = useState(source)
  const [rows, setRows] = useState<AdminPriceListRow[] | null>(null)
  const [latest, setLatest] = useState<AdminPriceListRow | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function onSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ source: value, page: '1' }), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    params.set('direction', direction)
    if (source) params.set('source', source)
    ;(async () => {
      const res = await apiGetWithRefresh<{
        prices: AdminPriceListRow[]
        latest: AdminPriceListRow | null
      }>(`/api/v1/admin/pricing?${params.toString()}`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setRows([])
        setError(res.error ?? 'بارگذاری قیمت‌ها ناموفق بود')
        return
      }
      setError(null)
      setRows(res.data?.prices ?? [])
      setLatest(res.data?.latest ?? null)
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
  }, [page, source, direction])

  return (
    <div>
      <AdminPageHeader
        title="قیمت‌گذاری"
        eyebrow="مالی"
        description="تاریخچه قیمت طلا — فقط خواندنی؛ به‌روزرسانی قیمت از این بخش انجام نمی‌شود"
      />

      <ReadOnlyNotice className="mb-4" />

      {/* آخرین قیمت ثبت‌شده */}
      <section className="bg-card border-border/60 mb-4 rounded-xl border p-5">
        <h2 className="text-foreground mb-3 text-sm font-bold">آخرین قیمت ثبت‌شده</h2>
        {latest ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminMetric
              label="خرید"
              value={formatExactAmount(latest.buyPrice)}
              unit="ریال"
              icon={TrendingUp}
              tone="gold"
            />
            <AdminMetric
              label="فروش"
              value={formatExactAmount(latest.sellPrice)}
              unit="ریال"
              icon={TrendingUp}
            />
            <div className="bg-card border-border/60 rounded-xl border p-4">
              <p className="text-muted-foreground text-[11px] font-medium">منبع و زمان</p>
              <p className="mt-2 text-sm">
                <SourceBadge source={latest.source} />
              </p>
              <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                {new Date(latest.recordedAt).toLocaleString('fa-IR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="skeleton-shimmer h-24 rounded-xl" />
        ) : (
          <p className="text-muted-foreground text-xs">قیمتی ثبت نشده است</p>
        )}
      </section>

      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="جستجوی منبع قیمت…"
        hasActiveFilters={!!source}
        onClear={() => {
          setSearchInput('')
          updateParams({ source: '', page: '1' })
        }}
      >
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
        keyOf={(p) => p.id}
        loading={loading}
        error={error}
        emptyMessage="قیمتی با این فیلتر یافت نشد"
      />
      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
