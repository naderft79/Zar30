// ============================================
// Zar30 - Admin Installments Client — مرکز عملیات قسطی
// ============================================
// جایگزین AdminFinanceList عمومی با صفحه اختصاصی:
//   - ردیف KPI: در انتظار تایید / فعال / تسویه‌شده / معوق + مبالغ
//   - جدول قراردادها با نوار پیشرفت اقساط و اکشن تایید/رد روی PENDING
//   - Sheet جزئیات: مشخصات، جدول کامل اقساط، متقاضی، چک (CHEQUE)
//   - Dialog تایید/رد با نمایش پیش‌نمایش مالی — بدون window.confirm/prompt
// permissions: INSTALLMENTS_REVIEW فقط دکمه‌ها را نشان می‌دهد (enforce سمت سرور)
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronLeft,
  IconCircleCheck,
  IconClock,
  IconCoin,
  IconEye,
  IconRefresh,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type {
  AdminInstallmentDetail,
  AdminInstallmentRow,
  AdminInstallmentStats,
} from '@/lib/services/admin-operations.service'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

const faNum = (v: string | number) => toPersianDigits(String(v))

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'در انتظار تایید',
  ACTIVE: 'فعال',
  COMPLETED: 'تسویه‌شده',
  DEFAULTED: 'نکول',
}

const PAY_LABEL: Record<string, string> = {
  PENDING: 'سررسید نشده',
  OVERDUE: 'معوق',
  PAID: 'پرداخت‌شده',
  DEFAULTED: 'نکول',
}

// ---------- KPI Card ----------
function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'warning' | 'success' | 'error'
  icon: React.ComponentType<{ className?: string; stroke?: number | string }>
}) {
  const toneCls = {
    neutral: 'text-foreground',
    warning: 'text-warning',
    success: 'text-success',
    error: 'text-error',
  }[tone]
  return (
    <div className="bg-card border-border/60 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <Icon className={cn('size-4', toneCls)} stroke={1.75} aria-hidden="true" />
      </div>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', toneCls)}>{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-[10px]">{hint}</p>}
    </div>
  )
}

// ---------- نوار پیشرفت اقساط ----------
function Progress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0
  return (
    <div className="min-w-24">
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-gold-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
        {faNum(paid)}/{faNum(total)} قسط · {faNum(pct)}٪
      </p>
    </div>
  )
}

// ---------- اکشن‌های تایید/رد ----------
function RowActions({
  row,
  onAction,
}: {
  row: AdminInstallmentRow
  onAction: (action: 'approve' | 'reject', row: AdminInstallmentRow) => void
}) {
  const { admin } = useAdmin()
  const canReview = hasPermission(admin.permissions, PERMISSIONS.INSTALLMENTS_REVIEW)
  if (!canReview || row.status !== 'PENDING') return null

  const btn =
    'inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onAction('approve', row)}
        className={cn(btn, 'bg-success/10 text-success hover:bg-success/20')}
      >
        <IconCheck className="size-3.5" strokeWidth={2.25} />
        صدور
      </button>
      <button
        type="button"
        onClick={() => onAction('reject', row)}
        className={cn(btn, 'bg-error/10 text-error hover:bg-error/20')}
      >
        <IconX className="size-3.5" strokeWidth={2.25} />
        رد
      </button>
    </div>
  )
}

export function AdminInstallmentsClient() {
  const { admin } = useAdmin()
  const canReview = hasPermission(admin.permissions, PERMISSIONS.INSTALLMENTS_REVIEW)

  const [stats, setStats] = useState<AdminInstallmentStats | null>(null)
  const [rows, setRows] = useState<AdminInstallmentRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // شیت جزئیات
  const [detail, setDetail] = useState<AdminInstallmentDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // dialog اکشن
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [actionRow, setActionRow] = useState<AdminInstallmentRow | null>(null)
  const [reason, setReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)

  const load = useCallback(async (status?: string) => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    const [listRes, statsRes] = await Promise.all([
      apiGetWithRefresh<{ contracts: AdminInstallmentRow[] }>(
        `/api/v1/admin/installments?${qs.toString()}`,
      ),
      apiGetWithRefresh<{ stats: AdminInstallmentStats }>('/api/v1/admin/installments/stats'),
    ])
    setLoading(false)
    if (!listRes.ok) {
      setListError(listRes.error ?? 'بارگذاری ناموفق بود')
      return
    }
    setListError(null)
    setRows(listRes.data?.contracts ?? [])
    if (statsRes.ok && statsRes.data) setStats(statsRes.data.stats)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [listRes, statsRes] = await Promise.all([
        apiGetWithRefresh<{ contracts: AdminInstallmentRow[] }>('/api/v1/admin/installments'),
        apiGetWithRefresh<{ stats: AdminInstallmentStats }>('/api/v1/admin/installments/stats'),
      ])
      if (cancelled) return
      setLoading(false)
      if (listRes.ok) setRows(listRes.data?.contracts ?? [])
      else setListError(listRes.error ?? 'بارگذاری ناموفق بود')
      if (statsRes.ok && statsRes.data) setStats(statsRes.data.stats)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function applyFilter(status: string) {
    setStatusFilter(status)
    await load(status || undefined)
  }

  async function openDetail(id: string) {
    setDetailLoading(true)
    setDetailOpen(true)
    const res = await apiGetWithRefresh<{ contract: AdminInstallmentDetail }>(
      `/api/v1/admin/installments/${id}`,
    )
    setDetailLoading(false)
    if (res.ok && res.data) setDetail(res.data.contract)
  }

  function openAction(kind: 'approve' | 'reject', row: AdminInstallmentRow) {
    setAction(kind)
    setActionRow(row)
    setReason('')
    setActionError(null)
    setActionDone(null)
  }

  function closeAction() {
    setAction(null)
    setActionRow(null)
  }

  async function confirmAction() {
    if (!action || !actionRow || actionBusy) return
    if (action === 'reject' && reason.trim().length < 3) {
      setActionError('دلیل رد باید حداقل ۳ کاراکتر باشد')
      return
    }
    setActionBusy(true)
    setActionError(null)
    const url =
      action === 'approve'
        ? `/api/v1/admin/installments/${actionRow.id}/approve`
        : `/api/v1/admin/installments/${actionRow.id}/reject`
    const res = await apiPost(url, action === 'reject' ? { reason: reason.trim() } : {})
    setActionBusy(false)
    if (!res.ok) {
      setActionError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    setActionDone(
      action === 'approve' ? 'قرارداد صادر شد — پیش‌پرداخت وصول و طلا تحویل شد.' : 'درخواست رد شد.',
    )
    closeAction()
    // refresh جزئیات اگر باز است + لیست
    if (detailOpen) {
      const fresh = await apiGetWithRefresh<{ contract: AdminInstallmentDetail }>(
        `/api/v1/admin/installments/${actionRow.id}`,
      )
      if (fresh.ok && fresh.data) setDetail(fresh.data.contract)
    }
    await load(statusFilter || undefined)
  }

  return (
    <div className="animate-stagger space-y-5">
      <AdminPageHeader
        title="خرید قسطی"
        eyebrow="محصولات"
        description="بررسی درخواست‌ها، صدور قرارداد و پیگیری اقساط"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/installments/plans"
              className="bg-gold-500 text-navy-950 hover:bg-gold-600 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors"
            >
              <IconSettings className="size-3.5" aria-hidden="true" />
              مدیریت طرح‌ها و کارمزدها
            </Link>
            <button
              type="button"
              onClick={() => void load(statusFilter || undefined)}
              className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
            >
              <IconRefresh className="size-3.5" aria-hidden="true" />
              بازخوانی
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="در انتظار تایید"
            value={faNum(stats.pending)}
            tone={stats.pending > 0 ? 'warning' : 'neutral'}
            icon={IconClock}
          />
          <StatCard
            label="قرارداد فعال"
            value={faNum(stats.active)}
            tone="success"
            icon={IconCoin}
          />
          <StatCard label="تسویه‌شده" value={faNum(stats.completed)} icon={IconCircleCheck} />
          <StatCard
            label="اقساط معوق"
            value={faNum(stats.overdueCount)}
            tone={stats.overdueCount > 0 ? 'error' : 'neutral'}
            icon={IconAlertTriangle}
          />
          <StatCard
            label="نکول"
            value={faNum(stats.defaulted)}
            tone={stats.defaulted > 0 ? 'error' : 'neutral'}
            icon={IconX}
          />
        </div>
      )}

      {/* فیلتر وضعیت */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: '', label: 'همه' },
          { value: 'PENDING', label: 'در انتظار' },
          { value: 'ACTIVE', label: 'فعال' },
          { value: 'COMPLETED', label: 'تسویه‌شده' },
          { value: 'DEFAULTED', label: 'نکول' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => void applyFilter(f.value)}
            className={cn(
              'h-8 rounded-lg border px-3 text-xs font-medium transition-colors',
              statusFilter === f.value
                ? 'border-gold-500 bg-gold-500/10 text-gold-700 dark:text-gold-400'
                : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* پیام موفقیت اکشن */}
      {actionDone && (
        <div
          role="status"
          className="text-success bg-success/10 flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium"
        >
          <IconCircleCheck className="size-5 shrink-0" aria-hidden="true" />
          {actionDone}
        </div>
      )}

      {/* جدول */}
      <div className="bg-card border-border/60 overflow-hidden rounded-xl border">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer h-12 rounded-lg" />
            ))}
          </div>
        ) : listError ? (
          <p role="alert" className="text-error p-4 text-xs">
            {listError}
          </p>
        ) : !rows || rows.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-xs">
            قراردادی با این فیلتر یافت نشد.
          </p>
        ) : (
          <ul className="divide-border/40 divide-y">
            {rows.map((r) => (
              <li
                key={r.id}
                className="hover:bg-muted/30 flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                {/* متقاضی + طرح */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${r.user.id}`}
                      className="text-foreground hover:text-gold-600 dark:hover:text-gold-400 truncate text-xs font-semibold transition-colors"
                    >
                      {r.user.name}
                    </Link>
                    <span className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                      {toPersianDigits(r.user.mobile)}
                    </span>
                    <AdminStatus status={r.status} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    {r.plan.name} · {faNum(r.plan.months)} قسط ·{' '}
                    {r.method === 'CHEQUE' ? 'چک' : 'اعتبارسنجی داخلی'}
                  </p>
                </div>

                {/* مبالغ */}
                <div className="flex items-center gap-5 sm:shrink-0">
                  <div className="text-start">
                    <p className="text-muted-foreground text-[10px]">اصل مبلغ</p>
                    <p className="text-foreground text-xs font-bold tabular-nums">
                      {r.principal}
                      <span className="text-muted-foreground ms-1 text-[9px] font-normal">
                        تومان
                      </span>
                    </p>
                  </div>
                  <div className="text-start">
                    <p className="text-muted-foreground text-[10px]">پیش‌پرداخت</p>
                    <p className="text-foreground text-xs font-bold tabular-nums">
                      {r.downPayment}
                      <span className="text-muted-foreground ms-1 text-[9px] font-normal">
                        تومان
                      </span>
                    </p>
                  </div>
                  <Progress
                    paid={r.paymentsCount > 0 ? r.paymentsCount : 0}
                    total={r.plan.months}
                  />
                </div>

                {/* جزئیات + اکشن */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => void openDetail(r.id)}
                    className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-medium transition-colors"
                  >
                    <IconEye className="size-3.5" aria-hidden="true" />
                    جزئیات
                  </button>
                  <RowActions row={r} onAction={openAction} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- شیت جزئیات ---------- */}
      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="جزئیات قرارداد قسطی"
        >
          <div
            className="bg-navy-950/60 absolute inset-0 backdrop-blur-sm"
            onClick={() => setDetailOpen(false)}
          />
          <div className="bg-background border-border/60 relative ms-auto flex h-full w-full max-w-xl flex-col border-s shadow-2xl">
            <div className="border-border/60 flex items-center justify-between border-b p-4">
              <h2 className="text-foreground text-sm font-bold">جزئیات قرارداد</h2>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                aria-label="بستن"
              >
                <IconX className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              {detailLoading || !detail ? (
                <div className="skeleton-shimmer h-40 rounded-xl" />
              ) : (
                <>
                  {/* خلاصه مالی */}
                  <div className="border-gold-500/30 from-gold-500/10 grid grid-cols-3 gap-3 rounded-xl border bg-gradient-to-bl to-transparent p-4">
                    <div>
                      <p className="text-muted-foreground text-[10px]">اصل مبلغ</p>
                      <p className="text-foreground mt-0.5 text-sm font-bold tabular-nums">
                        {detail.principal}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">پیش‌پرداخت</p>
                      <p className="text-foreground mt-0.5 text-sm font-bold tabular-nums">
                        {detail.downPayment}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">باقی‌مانده</p>
                      <p className="text-gold-700 dark:text-gold-400 mt-0.5 text-sm font-bold tabular-nums">
                        {detail.remainingTotal}
                      </p>
                    </div>
                  </div>

                  {/* مشخصات */}
                  <dl className="divide-border/40 grid grid-cols-2 gap-x-6 divide-y">
                    {[
                      { label: 'وضعیت', value: STATUS_LABEL[detail.status] ?? detail.status },
                      {
                        label: 'روش',
                        value:
                          detail.method === 'CHEQUE'
                            ? `چک صیادی${detail.chequeNumber ? ` · ${faNum(detail.chequeNumber)}` : ''}`
                            : 'اعتبارسنجی داخلی',
                      },
                      { label: 'طرح', value: detail.plan.name },
                      {
                        label: 'سود / پیش‌پرداخت',
                        value: `${faNum(detail.plan.interestRate)}٪ / ${faNum(detail.plan.downPaymentPercent)}٪`,
                      },
                      {
                        label: 'ثبت',
                        value: new Date(detail.createdAt).toLocaleDateString('fa-IR'),
                      },
                      ...(detail.approvedAt
                        ? [
                            {
                              label: 'تایید',
                              value: new Date(detail.approvedAt).toLocaleDateString('fa-IR'),
                            },
                          ]
                        : []),
                    ].map((f) => (
                      <div key={f.label} className="flex items-center justify-between py-2">
                        <dt className="text-muted-foreground text-[11px]">{f.label}</dt>
                        <dd className="text-foreground text-xs font-medium">{f.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* متقاضی */}
                  <div className="bg-muted/40 flex items-center justify-between rounded-xl p-3.5">
                    <div>
                      <p className="text-foreground text-xs font-semibold">{detail.user.name}</p>
                      <p className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                        {toPersianDigits(detail.user.mobile)}
                      </p>
                    </div>
                    <Link
                      href={`/admin/users/${detail.user.id}`}
                      className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
                    >
                      پروفایل کاربر
                      <IconChevronLeft className="size-3.5" />
                    </Link>
                  </div>

                  {/* جدول اقساط */}
                  <div>
                    <p className="text-foreground mb-2 text-xs font-bold">
                      جدول اقساط ({faNum(detail.payments.length)})
                    </p>
                    <div className="border-border/60 overflow-hidden rounded-xl border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground">
                            <th className="px-3 py-2 text-start font-medium">#</th>
                            <th className="px-3 py-2 text-start font-medium">سررسید</th>
                            <th className="px-3 py-2 text-start font-medium">مبلغ</th>
                            <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-border/40 divide-y">
                          {detail.payments.map((p) => (
                            <tr key={p.number}>
                              <td className="px-3 py-2 tabular-nums">{faNum(p.number)}</td>
                              <td className="text-muted-foreground px-3 py-2 tabular-nums">
                                {new Date(p.dueDate).toLocaleDateString('fa-IR')}
                              </td>
                              <td className="px-3 py-2 tabular-nums">
                                {p.amount}
                                {Number(p.lateFee) > 0 && (
                                  <span className="text-error ms-1 text-[10px]">
                                    +{p.lateFee} جریمه
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={cn(
                                    'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                                    p.status === 'PAID' && 'bg-success/10 text-success',
                                    p.status === 'OVERDUE' && 'bg-error/10 text-error',
                                    p.status === 'PENDING' && 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {PAY_LABEL[p.status] ?? p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* اکشن در شیت — برای PENDING */}
            {detail && detail.status === 'PENDING' && canReview && (
              <div className="border-border/60 flex items-center justify-end gap-2 border-t p-4">
                <button
                  type="button"
                  onClick={() => {
                    const listItem = rows?.find((r) => r.id === detail.id)
                    if (listItem) openAction('reject', listItem)
                  }}
                  className="bg-error/10 text-error hover:bg-error/20 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors"
                >
                  <IconX className="size-3.5" strokeWidth={2.25} />
                  رد درخواست
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const listItem = rows?.find((r) => r.id === detail.id)
                    if (listItem) openAction('approve', listItem)
                  }}
                  className="bg-gold-500 text-navy-950 hover:bg-gold-600 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors"
                >
                  <IconCheck className="size-3.5" strokeWidth={2.25} />
                  تایید و صدور
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Dialog اکشن ---------- */}
      {action && actionRow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={action === 'approve' ? 'تایید قرارداد' : 'رد درخواست'}
        >
          <div className="bg-navy-950/60 absolute inset-0 backdrop-blur-sm" onClick={closeAction} />
          <div className="bg-background border-border/60 relative w-full max-w-md rounded-2xl border p-5 shadow-2xl">
            <h3 className="text-foreground text-sm font-bold">
              {action === 'approve' ? 'تایید و صدور قرارداد' : 'رد درخواست خرید قسطی'}
            </h3>

            {/* پیش‌نمایش مالی */}
            <div className="bg-muted/40 mt-3 space-y-1.5 rounded-xl p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">متقاضی</span>
                <span className="text-foreground font-medium">{actionRow.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">طرح</span>
                <span className="text-foreground">
                  {actionRow.plan.name} · {faNum(actionRow.plan.months)} قسط
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">اصل مبلغ</span>
                <FinancialValue value={actionRow.principal} unit="تومان" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">پیش‌پرداخت</span>
                <FinancialValue value={actionRow.downPayment} unit="تومان" />
              </div>
            </div>

            {action === 'approve' && (
              <p className="text-warning bg-warning/10 mt-3 rounded-xl p-3 text-[11px] leading-5">
                در لحظه تایید: پیش‌پرداخت از کیف پول تومانی کاربر کسر، طلا به دارایی او اضافه و جدول
                اقساط تولید می‌شود. اگر موجودی کیف پول کافی نباشد، عملیات رد می‌شود.
              </p>
            )}

            {action === 'reject' && (
              <label className="mt-3 block space-y-1.5">
                <span className="text-muted-foreground text-[11px]">دلیل رد (الزامی)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="مثلاً: اعتبارسنجی کافی نیست / مدارک ناقص است…"
                  className="border-border/60 bg-background text-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-xs leading-6 focus-visible:ring-2 focus-visible:outline-none"
                />
              </label>
            )}

            {actionError && (
              <p role="alert" className="text-error mt-3 flex items-center gap-1.5 text-xs">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {actionError}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAction}
                disabled={actionBusy}
                className="text-muted-foreground hover:text-foreground h-9 rounded-lg px-4 text-xs font-medium transition-colors disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={actionBusy}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-5 text-xs font-bold transition-colors disabled:opacity-50',
                  action === 'approve'
                    ? 'bg-gold-500 text-navy-950 hover:bg-gold-600'
                    : 'bg-error hover:bg-error/90 text-white',
                )}
              >
                {actionBusy ? 'در حال انجام…' : action === 'approve' ? 'تایید نهایی' : 'ثبت رد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
