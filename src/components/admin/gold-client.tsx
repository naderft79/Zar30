// ============================================
// Zar30 - Admin Gold Holdings (Client)
// ============================================
// aggregate واقعی + لیست حساب‌های GOLD — valuation/P&L صریحاً unavailable
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Coins, Info } from 'lucide-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminAccountListRow } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminMetric } from '@/components/admin/admin-metric'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import { FinancialValue } from '@/components/admin/financial-value'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'

interface GoldData {
  summary: { balance: string; lockedBalance: string; accountsCount: number }
  accounts: AdminAccountListRow[]
}

const columns: AdminColumn<AdminAccountListRow>[] = [
  {
    key: 'id',
    header: 'شناسه حساب',
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {a.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (a) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">
          {[a.wallet.user.firstName, a.wallet.user.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(a.wallet.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'balance',
    header: 'مانده طلا',
    render: (a) => <FinancialValue value={a.balance} unit="گرم" />,
  },
  {
    key: 'locked',
    header: 'مسدود',
    render: (a) => <FinancialValue value={a.lockedBalance} unit="گرم" />,
  },
  {
    key: 'updatedAt',
    header: 'به‌روزرسانی',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(a.updatedAt).toLocaleDateString('fa-IR')}
      </span>
    ),
  },
]

export function AdminGoldClient() {
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [data, setData] = useState<GoldData | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<GoldData>(`/api/v1/admin/gold?page=${page}&limit=20`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری دارایی طلا ناموفق بود')
        return
      }
      setError(null)
      setData(res.data ?? null)
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div>
      <AdminPageHeader
        title="دارایی طلا"
        eyebrow="مالی"
        description="موجودی طلای کاربران — aggregate واقعی PostgreSQL"
      />

      <ReadOnlyNotice className="mb-4" />

      {error && !data ? (
        <div
          role="alert"
          className="border-error/30 bg-error/5 text-error rounded-xl border p-4 text-xs"
        >
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <AdminMetric
              label="کل طلای کاربران"
              value={data ? formatExactAmount(data.summary.balance) : '—'}
              unit="گرم"
              icon={Coins}
              tone="gold"
            />
            <AdminMetric
              label="طلا مسدود"
              value={data ? formatExactAmount(data.summary.lockedBalance) : '—'}
              unit="گرم"
              icon={Coins}
              tone="warning"
            />
            <AdminMetric
              label="تعداد حساب‌های طلا"
              value={data ? toPersianDigits(data.summary.accountsCount) : '—'}
              icon={Coins}
            />
          </div>

          {/* ارزش‌گذاری و سود/زیان — داده authoritative acquisition/price linkage وجود ندارد */}
          <div
            role="note"
            className="border-border/60 bg-muted/40 text-muted-foreground mb-4 flex items-start gap-2.5 rounded-xl border border-dashed p-3.5 text-xs leading-5"
          >
            <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <p>
              ارزش‌گذاری ریالی و سود/زیان دارایی طلا در دسترس نیست — ارتباط قیمت خرید کاربر و قیمت
              لحظه‌ای معتبر هنوز در دامنه داده ثبت نشده است.
            </p>
          </div>

          <AdminDataTable
            columns={columns}
            rows={data?.accounts ?? null}
            keyOf={(a) => a.id}
            loading={loading}
            error={error}
            emptyMessage="حساب طلایی ثبت نشده است"
            rowHref={(a) => `/admin/accounts/${a.id}`}
          />
          <AdminPagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  )
}
