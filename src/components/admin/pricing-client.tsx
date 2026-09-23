// ============================================
// Zar30 - Admin Pricing History (Client)
// ============================================
// آخرین قیمت + تاریخچه GoldPrice — read-only؛ بدون UI به‌روزرسانی قیمت
// source demo/mock → badge «داده توسعه/نمایشی»
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type { AdminPriceListRow } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminMetric } from '@/components/admin/admin-metric'
import { FinancialValue } from '@/components/admin/financial-value'
import { formatExactAmount } from '@/lib/utils/format'
import { IconTrendingUp, IconPlus } from '@tabler/icons-react'

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
    render: (p) => <FinancialValue value={p.buyPrice} unit="تومان" />,
  },
  {
    key: 'sell',
    header: 'قیمت فروش',
    render: (p) => <FinancialValue value={p.sellPrice} unit="تومان" />,
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

  // فرم ثبت قیمت جدید
  const [showForm, setShowForm] = useState(false)
  const [buyInput, setBuyInput] = useState('')
  const [sellInput, setSellInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [formVersion, setFormVersion] = useState(0)

  async function submitPrice() {
    if (!/^\d+$/.test(buyInput) || !/^\d+$/.test(sellInput)) {
      setFormError('قیمت‌ها باید عدد صحیح تومان باشند')
      return
    }
    setFormBusy(true)
    setFormError(null)
    const res = await apiPost('/api/v1/admin/pricing', {
      buyPrice: buyInput,
      sellPrice: sellInput,
      source: 'admin',
    })
    setFormBusy(false)
    if (!res.ok) {
      setFormError(res.error ?? 'ثبت قیمت ناموفق بود')
      return
    }
    setShowForm(false)
    setBuyInput('')
    setSellInput('')
    setFormVersion((v) => v + 1)
  }

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
  }, [page, source, direction, formVersion])

  return (
    <div>
      <AdminPageHeader
        title="قیمت‌گذاری"
        eyebrow="مالی"
        description="تاریخچه قیمت طلا + ثبت قیمت جدید (permission: pricing.update)"
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="bg-gold-500 hover:bg-gold-600 text-navy-950 flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors"
          >
            <IconPlus className="size-4" stroke={2} />
            ثبت قیمت جدید
          </button>
        }
      />

      {/* فرم ثبت قیمت — قیمت معاملات فعلی را تعیین می‌کند */}
      {showForm && (
        <section className="bg-card border-gold-500/30 mb-4 rounded-xl border p-5">
          <h2 className="text-foreground mb-3 text-sm font-bold">ثبت قیمت جدید (تومان/گرم)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-muted-foreground text-[11px]">قیمت خرید (کاربر می‌خرد)</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={buyInput}
                onChange={(e) => setBuyInput(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="8500000"
                className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-xs tabular-nums focus-visible:ring-2 focus-visible:outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-muted-foreground text-[11px]">قیمت فروش (کاربر می‌فروشد)</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={sellInput}
                onChange={(e) => setSellInput(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="8450000"
                className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-xs tabular-nums focus-visible:ring-2 focus-visible:outline-none"
              />
            </label>
          </div>
          {formError && (
            <p role="alert" className="text-error mt-2 text-[11px]">
              {formError}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submitPrice}
              disabled={formBusy}
              className="bg-gold-500 hover:bg-gold-600 text-navy-950 h-9 rounded-lg px-4 text-xs font-semibold disabled:opacity-50"
            >
              {formBusy ? 'در حال ثبت…' : 'ثبت قیمت'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground h-9 px-3 text-xs"
            >
              انصراف
            </button>
          </div>
        </section>
      )}

      {/* آخرین قیمت ثبت‌شده */}
      <section className="bg-card border-border/60 mb-4 rounded-xl border p-5">
        <h2 className="text-foreground mb-3 text-sm font-bold">آخرین قیمت ثبت‌شده</h2>
        {latest ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminMetric
              label="خرید"
              value={formatExactAmount(latest.buyPrice)}
              unit="تومان"
              icon={IconTrendingUp}
              tone="gold"
            />
            <AdminMetric
              label="فروش"
              value={formatExactAmount(latest.sellPrice)}
              unit="تومان"
              icon={IconTrendingUp}
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
