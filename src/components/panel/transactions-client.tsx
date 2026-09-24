// ============================================
// Zar30 - Transactions Page (صفحه کامل تراکنش‌ها)
// ============================================
// /dashboard/transactions — لیست کامل با فیلتر نوع/وضعیت/بازه تاریخ + صفحه‌بندی
// هر ردیف → رسید کپی‌پذیر
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconFilter, IconHistory } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { ReceiptSheet, type ReceiptField } from './receipt-sheet'

interface TxRow {
  id: string
  type: string
  amount: string
  status: string
  bankRef: string | null
  gatewayRef: string | null
  createdAt: string
}

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAW: 'برداشت',
  FEE: 'کارمزد',
  TRANSFER: 'انتقال',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  COMPLETED: 'موفق',
  FAILED: 'ناموفق',
  REVERSED: 'برگشت‌خورده',
}

const TYPE_OPTIONS = [
  { value: '', label: 'همه انواع' },
  { value: 'DEPOSIT', label: 'واریز' },
  { value: 'WITHDRAW', label: 'برداشت' },
  { value: 'FEE', label: 'کارمزد' },
  { value: 'TRANSFER', label: 'انتقال' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'COMPLETED', label: 'موفق' },
  { value: 'FAILED', label: 'ناموفق' },
  { value: 'REVERSED', label: 'برگشت‌خورده' },
]

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-9 rounded-lg border px-2.5 text-xs focus-visible:ring-2 focus-visible:outline-none'

function fmtDate(d: string) {
  return new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

export function TransactionsClient() {
  const [items, setItems] = useState<TxRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState<TxRow | null>(null)

  // فیلترها — draft تا زمان «اعمال» جدا از applied باقی می‌ماند
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [applied, setApplied] = useState({ type: '', status: '', from: '', to: '' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (applied.type) params.set('type', applied.type)
      if (applied.status) params.set('status', applied.status)
      if (applied.from) params.set('from', new Date(applied.from).toISOString())
      if (applied.to) params.set('to', new Date(`${applied.to}T23:59:59`).toISOString())
      const res = await apiGetWithRefresh<{ transactions: TxRow[] }>(
        `/api/v1/wallet/transactions?${params}`,
      )
      if (cancelled) return
      if (res.ok) {
        setItems(res.data?.transactions ?? [])
        setTotalPages(res.meta?.totalPages ?? 1)
        setTotal(res.meta?.total ?? 0)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [page, applied])

  function applyFilters() {
    setLoading(true)
    setPage(1)
    setApplied({ type, status, from, to })
  }

  function clearFilters() {
    setType('')
    setStatus('')
    setFrom('')
    setTo('')
    setLoading(true)
    setPage(1)
    setApplied({ type: '', status: '', from: '', to: '' })
  }

  const hasFilter = type || status || from || to

  function fieldsFor(t: TxRow): ReceiptField[] {
    return [
      { label: 'شناسه تراکنش', value: t.id, mono: true },
      { label: 'نوع', value: TX_LABELS[t.type] ?? t.type },
      { label: 'مبلغ', value: `${formatExactAmount(t.amount)} تومان`, copyValue: t.amount },
      { label: 'وضعیت', value: STATUS_LABELS[t.status] ?? t.status },
      { label: 'تاریخ', value: fmtDate(t.createdAt), copyValue: t.createdAt },
      ...(t.bankRef ? [{ label: 'کد پیگیری', value: t.bankRef, mono: true }] : []),
      ...(t.gatewayRef ? [{ label: 'مرجع درگاه', value: t.gatewayRef, mono: true }] : []),
    ]
  }

  return (
    <div className="space-y-4">
      {/* نوار فیلتر */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-2 p-3 sm:p-4">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold">
            <IconFilter className="size-4" aria-hidden="true" />
            فیلتر
          </span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-foreground">از</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-foreground">تا</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </label>
          <div className="ms-auto flex items-center gap-1.5">
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                پاک کردن
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={applyFilters}>
              اعمال
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* لیست */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-shimmer h-12 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={IconHistory}
                title="تراکنشی یافت نشد"
                description={
                  hasFilter ? 'فیلترها را تغییر دهید یا پاک کنید.' : 'هنوز تراکنشی ثبت نشده است.'
                }
              />
            </div>
          ) : (
            <ul className="divide-border/40 divide-y">
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setReceipt(t)}
                    className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3.5 text-right transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground text-xs font-semibold">
                        {TX_LABELS[t.type] ?? t.type}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                        {fmtDate(t.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                        {formatExactAmount(t.amount)}{' '}
                        <span className="text-muted-foreground">تومان</span>
                      </p>
                      <StatusBadge tone="gold" dot={false} className="mt-1">
                        {STATUS_LABELS[t.status] ?? t.status}
                      </StatusBadge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true)
              setPage((p) => p - 1)
            }}
          >
            قبلی
          </Button>
          <span className="text-muted-foreground text-xs tabular-nums">
            صفحه {page} از {totalPages} ({total})
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => {
              setLoading(true)
              setPage((p) => p + 1)
            }}
          >
            بعدی
          </Button>
        </div>
      )}

      {/* رسید کپی‌پذیر */}
      <ReceiptSheet
        open={receipt != null}
        onClose={() => setReceipt(null)}
        title={receipt ? (TX_LABELS[receipt.type] ?? 'رسید تراکنش') : 'رسید'}
        statusLabel={receipt ? (STATUS_LABELS[receipt.status] ?? receipt.status) : undefined}
        fields={receipt ? fieldsFor(receipt) : []}
      />
    </div>
  )
}
