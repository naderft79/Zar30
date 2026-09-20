// ============================================
// Zar30 - Admin KYC List (Client)
// ============================================
// URL query = source of truth؛ فیلتر وضعیت + جستجو + pagination سمت سرور
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminKycListRow } from '@/lib/services/admin-kyc.service'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { toPersianDigits } from '@/lib/utils/format'

const KYC_LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'سطح ۰',
  LEVEL_1: 'سطح ۱',
  LEVEL_2: 'سطح ۲',
  LEVEL_3: 'سطح ۳',
}

const selectClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

const columns: AdminColumn<AdminKycListRow>[] = [
  {
    key: 'applicant',
    header: 'متقاضی',
    render: (s) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-sm font-medium">
          {[s.applicant.firstName, s.applicant.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        <span className="text-muted-foreground block text-[11px] tabular-nums" dir="ltr">
          {toPersianDigits(s.applicant.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (s) => <AdminStatus status={s.status} />,
  },
  {
    key: 'level',
    header: 'سطح',
    render: (s) => KYC_LEVEL_LABELS[s.level] ?? s.level,
  },
  {
    key: 'documents',
    header: 'مدارک',
    render: (s) => <span className="tabular-nums">{toPersianDigits(s.documentsCount)}</span>,
  },
  {
    key: 'submittedAt',
    header: 'ارسال',
    render: (s) =>
      s.submittedAt ? (
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {new Date(s.submittedAt).toLocaleDateString('fa-IR')}
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'reviewer',
    header: 'بررسی‌کننده',
    mobile: false,
    render: (s) =>
      s.reviewer
        ? [s.reviewer.firstName, s.reviewer.lastName].filter(Boolean).join(' ') || '—'
        : '—',
  },
]

export function AdminKycListClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const direction = searchParams.get('direction') ?? 'desc'

  const [searchInput, setSearchInput] = useState(q)
  const [rows, setRows] = useState<AdminKycListRow[] | null>(null)
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

  // stale-while-revalidate — داده قبلی تا رسیدن پاسخ نمایش داده می‌شود
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    params.set('sortBy', sortBy)
    params.set('direction', direction)
    ;(async () => {
      const res = await apiGetWithRefresh<{ submissions: AdminKycListRow[] }>(
        `/api/v1/admin/kyc?${params.toString()}`,
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setRows([])
        setError(res.error ?? 'بارگذاری پرونده‌ها ناموفق بود')
        return
      }
      setError(null)
      setRows(res.data?.submissions ?? [])
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
  }, [page, q, status, sortBy, direction])

  const hasFilters = !!(q || status)

  return (
    <div>
      <AdminPageHeader
        title="احراز هویت"
        eyebrow="مشتریان"
        description="پرونده‌های KYC — فیلتر وضعیت و جستجوی سمت سرور"
      />

      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="جستجو: شناسه پرونده، موبایل یا نام متقاضی…"
        hasActiveFilters={hasFilters}
        onClear={() => {
          setSearchInput('')
          updateParams({ q: '', status: '', page: '1' })
        }}
      >
        <select
          aria-label="فیلتر وضعیت پرونده"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="SUBMITTED">در صف بررسی</option>
          <option value="UNDER_REVIEW">در حال بررسی</option>
          <option value="APPROVED">تاییدشده</option>
          <option value="REJECTED">ردشده</option>
          <option value="NEEDS_RESUBMISSION">نیازمند اصلاح</option>
          <option value="IN_PROGRESS">در حال تکمیل</option>
          <option value="NOT_STARTED">شروع نشده</option>
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
          <option value="submittedAt:asc">صف بررسی (قدیمی‌ترین ارسال)</option>
          <option value="submittedAt:desc">آخرین ارسال</option>
          <option value="reviewedAt:desc">آخرین بررسی</option>
        </select>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        rows={rows}
        keyOf={(s) => s.id}
        loading={loading}
        error={error}
        emptyMessage="پرونده‌ای با این فیلترها یافت نشد"
        rowHref={(s) => `/admin/kyc/${s.id}`}
      />

      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
