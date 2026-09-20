// ============================================
// Zar30 - Admin Users List (Client)
// ============================================
// URL query = source of truth؛ search با debounce 300ms
// fetch از /api/v1/admin/users — pagination/filter/sort سمت سرور
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminUserListRow } from '@/lib/services/admin-user.service'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'

const KYC_LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'سطح ۰',
  LEVEL_1: 'سطح ۱',
  LEVEL_2: 'سطح ۲',
  LEVEL_3: 'سطح ۳',
}

const selectClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

const columns: AdminColumn<AdminUserListRow>[] = [
  {
    key: 'user',
    header: 'کاربر',
    render: (u) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-sm font-medium">
          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        <span className="text-muted-foreground block truncate text-[11px] tabular-nums" dir="ltr">
          {u.id.slice(0, 8)}
        </span>
      </div>
    ),
  },
  {
    key: 'mobile',
    header: 'موبایل',
    render: (u) => (
      <span className="tabular-nums" dir="ltr">
        {toPersianDigits(u.mobile)}
      </span>
    ),
  },
  {
    key: 'kycLevel',
    header: 'سطح KYC',
    render: (u) => KYC_LEVEL_LABELS[u.kycLevel] ?? u.kycLevel,
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (u) => <AdminStatus status={u.status} />,
  },
  {
    key: 'rial',
    header: 'مانده ریال',
    render: (u) => <span className="tabular-nums">{formatExactAmount(u.rialBalance)}</span>,
  },
  {
    key: 'gold',
    header: 'طلا (گرم)',
    render: (u) => <span className="tabular-nums">{formatExactAmount(u.goldBalance)}</span>,
  },
  {
    key: 'lastLoginAt',
    header: 'آخرین فعالیت',
    render: (u) =>
      u.lastLoginAt ? (
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {new Date(u.lastLoginAt).toLocaleDateString('fa-IR')}
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'createdAt',
    header: 'ایجاد',
    mobile: false,
    render: (u) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(u.createdAt).toLocaleDateString('fa-IR')}
      </span>
    ),
  },
]

export function AdminUsersClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const kycLevel = searchParams.get('kycLevel') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const direction = searchParams.get('direction') ?? 'desc'

  const [searchInput, setSearchInput] = useState(q)
  const [rows, setRows] = useState<AdminUserListRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // debounce جستجو → URL
  function onSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value, page: '1' })
    }, 300)
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

  // fetch — هر تغییر query؛ داده قبلی تا رسیدن پاسخ نمایش داده می‌شود (stale-while-revalidate)
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (kycLevel) params.set('kycLevel', kycLevel)
    params.set('sortBy', sortBy)
    params.set('direction', direction)
    ;(async () => {
      const res = await apiGetWithRefresh<{ users: AdminUserListRow[] }>(
        `/api/v1/admin/users?${params.toString()}`,
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setRows([])
        setError(res.error ?? 'بارگذاری کاربران ناموفق بود')
        return
      }
      setError(null)
      setRows(res.data?.users ?? [])
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
  }, [page, q, status, kycLevel, sortBy, direction])

  const hasFilters = !!(q || status || kycLevel)

  return (
    <div>
      <AdminPageHeader
        title="کاربران"
        eyebrow="مشتریان"
        description="لیست کاربران با فیلتر و جستجوی سمت سرور"
      />

      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="جستجو: موبایل، نام، ایمیل…"
        hasActiveFilters={hasFilters}
        onClear={() => {
          setSearchInput('')
          updateParams({ q: '', status: '', kycLevel: '', page: '1' })
        }}
      >
        <select
          aria-label="فیلتر وضعیت"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="ACTIVE">فعال</option>
          <option value="BLOCKED">مسدود</option>
          <option value="DELETED">حذف‌شده</option>
        </select>
        <select
          aria-label="فیلتر سطح احراز هویت"
          value={kycLevel}
          onChange={(e) => updateParams({ kycLevel: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="">همه سطوح KYC</option>
          <option value="LEVEL_0">سطح ۰</option>
          <option value="LEVEL_1">سطح ۱</option>
          <option value="LEVEL_2">سطح ۲</option>
          <option value="LEVEL_3">سطح ۳</option>
        </select>
        <select
          aria-label="مرتب‌سازی"
          value={`${sortBy}:${direction}`}
          onChange={(e) => {
            const [s, d] = e.target.value.split(':')
            updateParams({ sortBy: s ?? 'createdAt', direction: d ?? 'desc', page: '1' })
          }}
          className={selectClass}
        >
          <option value="createdAt:desc">جدیدترین</option>
          <option value="createdAt:asc">قدیمی‌ترین</option>
          <option value="lastLoginAt:desc">آخرین فعالیت (جدید)</option>
          <option value="lastLoginAt:asc">آخرین فعالیت (قدیم)</option>
        </select>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        rows={rows}
        keyOf={(u) => u.id}
        loading={loading}
        error={error}
        emptyMessage="کاربری با این فیلترها یافت نشد"
        rowHref={(u) => `/admin/users/${u.id}`}
      />

      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
