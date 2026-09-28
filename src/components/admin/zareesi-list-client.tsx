// ============================================
// Zar30 - Admin Zareesi Card List (Client)
// ============================================
// مدیریت سفارش‌های کارت زرسی — تایید، تولید، ارسال، فعال‌سازی، رد
// ============================================

'use client'

import { useState } from 'react'
import {
  IconCircleCheck,
  IconLoader2,
  IconPackage,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons-react'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'
import { apiPatch } from '@/lib/api/client'
import { cn } from 'cn'

interface ZareesiAdminRow {
  id: string
  color: 'GOLD' | 'NAVY' | 'CREAM'
  status: string
  cardNumber: string
  holderName: string
  shippingMethod: string
  feeGold: string
  feeToman: string
  trackingCode: string | null
  rejectedReason: string | null
  createdAt: string
  user: { name: string; mobile: string }
  address?: { city: string; province: string; address: string } | null
}

const COLOR_LABEL: Record<string, { label: string; cls: string }> = {
  GOLD: { label: 'طلایی', cls: 'bg-gradient-to-br from-[#f7e7b0] to-[#b8860b]' },
  NAVY: { label: 'سورمه‌ای', cls: 'bg-gradient-to-br from-[#1e3a8a] to-[#0b1220]' },
  CREAM: { label: 'کرمی', cls: 'bg-gradient-to-br from-[#fdf6e3] to-[#c9a86a]' },
}

const COLOR_CLASS: Record<string, string> = {
  GOLD: 'bg-warning/10 text-warning',
  NAVY: 'bg-info/10 text-info',
  CREAM: 'bg-muted text-muted-foreground',
}

// ---------- دیالوگ عملیات ----------
function ActionDialog({
  row,
  action,
  onClose,
  onDone,
}: {
  row: ZareesiAdminRow
  action: 'approve' | 'production' | 'ship' | 'activate' | 'reject' | null
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [tracking, setTracking] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!action) return null

  const needReason = action === 'reject'
  const needTracking = action === 'ship'
  const title: Record<string, string> = {
    approve: 'تایید سفارش',
    production: 'ارسال به تولید',
    ship: 'ثبت ارسال',
    activate: 'فعال‌سازی کارت',
    reject: 'رد سفارش (برگشت کارمزد)',
  }
  const apiAction: Record<string, string> = {
    approve: 'approve',
    production: 'production',
    ship: 'ship',
    activate: 'activate',
    reject: 'reject',
  }

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    const body: Record<string, unknown> = { action: apiAction[action!] }
    if (needReason) body.reason = reason
    if (needTracking) body.trackingCode = tracking
    if (!needReason && !needTracking) body.adminNote = reason || undefined
    const res = await apiPatch(`/api/v1/admin/zareesi-cards/${row.id}`, body)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    onDone()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-sm rounded-2xl border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-foreground text-sm font-bold">{title[action]}</h3>
        <p className="text-muted-foreground mt-1 text-[11px]">
          کارت {COLOR_LABEL[row.color]?.label} — {row.holderName} (
          {toPersianDigits(row.user.mobile)})
        </p>
        {(needReason || needTracking) && (
          <input
            value={needTracking ? tracking : reason}
            onChange={(e) =>
              needTracking ? setTracking(e.target.value) : setReason(e.target.value)
            }
            placeholder={needTracking ? 'کد رهگیری پستی' : 'دلیل رد (برای کاربر نمایش داده می‌شود)'}
            className="border-border/60 bg-background text-foreground focus-visible:ring-ring mt-3 h-10 w-full rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none"
          />
        )}
        {action === 'reject' && (
          <p className="text-success mt-2 text-[10px]">
            با رد سفارش، کارمزد گرمی و پست به‌صورت کامل به کیف پول کاربر برگشت می‌خورد.
          </p>
        )}
        {error && <p className="text-error mt-2 text-[11px]">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={
              busy ||
              (needReason && reason.trim().length < 3) ||
              (needTracking && tracking.trim().length < 4)
            }
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold disabled:opacity-40',
              action === 'reject'
                ? 'bg-error/10 text-error hover:bg-error/20'
                : 'bg-primary text-primary-foreground hover:bg-gold-400',
            )}
          >
            {busy ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconCircleCheck className="size-4" />
            )}
            تایید عملیات
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-border/60 text-muted-foreground hover:text-foreground h-9 rounded-lg border px-4 text-xs"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- اکشن‌های ردیف ----------
function RowActions({ row, onChanged }: { row: ZareesiAdminRow; onChanged: () => void }) {
  const [dialog, setDialog] = useState<
    'approve' | 'production' | 'ship' | 'activate' | 'reject' | null
  >(null)

  const actions: {
    key: typeof dialog
    label: string
    icon: typeof IconPackage
    show: boolean
    cls: string
  }[] = [
    {
      key: 'approve',
      label: 'تایید',
      icon: IconCircleCheck,
      show: row.status === 'PENDING',
      cls: 'text-success hover:bg-success/10',
    },
    {
      key: 'production',
      label: 'تولید',
      icon: IconPackage,
      show: row.status === 'APPROVED',
      cls: 'text-info hover:bg-info/10',
    },
    {
      key: 'ship',
      label: 'ارسال',
      icon: IconTruckDelivery,
      show: row.status === 'PRODUCTION',
      cls: 'text-primary hover:bg-primary/10',
    },
    {
      key: 'activate',
      label: 'فعال‌سازی',
      icon: IconCircleCheck,
      show: row.status === 'SHIPPED',
      cls: 'text-success hover:bg-success/10',
    },
    {
      key: 'reject',
      label: 'رد',
      icon: IconX,
      show: row.status === 'PENDING' || row.status === 'APPROVED',
      cls: 'text-error hover:bg-error/10',
    },
  ]

  return (
    <>
      <div className="flex items-center gap-1">
        {actions
          .filter((a) => a.show)
          .map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setDialog(a.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors',
                a.cls,
              )}
            >
              <a.icon className="size-3.5" />
              {a.label}
            </button>
          ))}
      </div>
      <ActionDialog row={row} action={dialog} onClose={() => setDialog(null)} onDone={onChanged} />
    </>
  )
}

const columns: AdminColumn<ZareesiAdminRow>[] = [
  {
    key: 'cardNumber',
    header: 'شماره کارت',
    render: (c) => (
      <div className="flex items-center gap-2">
        <span className={cn('h-6 w-9 shrink-0 rounded shadow-sm', COLOR_CLASS[c.color])} />
        <div className="min-w-0">
          <span className="text-foreground block font-mono text-[11px] font-bold" dir="ltr">
            {c.cardNumber}
          </span>
          <span className="text-muted-foreground block text-[10px]">{c.holderName}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (c) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{c.user.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(c.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'color',
    header: 'رنگ',
    render: (c) => (
      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', COLOR_CLASS[c.color])}>
        {COLOR_LABEL[c.color]?.label}
      </span>
    ),
  },
  {
    key: 'fee',
    header: 'کارمزد',
    render: (c) => <FinancialValue value={c.feeGold} unit="گرم" />,
  },
  {
    key: 'shipping',
    header: 'ارسال',
    mobile: false,
    render: (c) => (
      <span className="text-muted-foreground text-[11px]">
        {c.shippingMethod === 'POST'
          ? c.trackingCode
            ? `پست — ${c.trackingCode}`
            : 'پست پیشتاز'
          : 'حضوری'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (c) => <AdminStatus status={c.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    mobile: false,
    render: (c) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(c.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminZareesiClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AdminFinanceList<ZareesiAdminRow>
      key={refreshKey}
      title="کارت زرسی"
      eyebrow="خدمات"
      description="سفارش‌های کارت اعتباری طلایی — کارمزد از کیف پول طلایی کاربر کسر شده است"
      endpoint="/api/v1/admin/zareesi-cards"
      dataKey="cards"
      columns={columns}
      keyOf={(c) => c.id}
      searchPlaceholder="جستجو: شماره کارت، نام، موبایل…"
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار تایید' },
            { value: 'APPROVED', label: 'تاییدشده' },
            { value: 'PRODUCTION', label: 'در حال تولید' },
            { value: 'SHIPPED', label: 'ارسال‌شده' },
            { value: 'ACTIVE', label: 'فعال' },
            { value: 'REJECTED', label: 'ردشده' },
            { value: 'BLOCKED', label: 'مسدود' },
          ],
        },
        {
          key: 'color',
          label: 'همه رنگ‌ها',
          options: [
            { value: 'GOLD', label: 'طلایی' },
            { value: 'NAVY', label: 'سورمه‌ای' },
            { value: 'CREAM', label: 'کرمی' },
          ],
        },
      ]}
      rowActions={(row) => <RowActions row={row} onChanged={() => setRefreshKey((k) => k + 1)} />}
    />
  )
}
