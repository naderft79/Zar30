// ============================================
// Zar30 - Admin Payments List (Client)
// ============================================

'use client'

import type { AdminPaymentRow } from '@/lib/services/admin-ops.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const columns: AdminColumn<AdminPaymentRow>[] = [
  {
    key: 'id',
    header: 'شناسه',
    render: (p) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {p.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (p) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{p.user.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(p.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (p) => <FinancialValue value={p.amount} unit="تومان" />,
  },
  {
    key: 'gateway',
    header: 'درگاه',
    mobile: false,
    render: (p) => <span className="text-muted-foreground text-[11px]">{p.gateway}</span>,
  },
  {
    key: 'ref',
    header: 'مرجع',
    mobile: false,
    render: (p) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {p.refId ?? p.authority?.slice(0, 12) ?? '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (p) => <AdminStatus status={p.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    mobile: false,
    render: (p) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(p.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminPaymentsClient() {
  return (
    <AdminFinanceList<AdminPaymentRow>
      title="پرداخت‌های درگاه"
      eyebrow="معاملات و مالی"
      description="تراکنش‌های درگاه پرداخت — وضعیت، مرجع و خطاها"
      endpoint="/api/v1/admin/payments"
      dataKey="payments"
      columns={columns}
      keyOf={(p) => p.id}
      detailHref={(p) => `/admin/payments/${p.id}`}
      searchPlaceholder="جستجو: شناسه، authority، مرجع، موبایل کاربر…"
      dateRange
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار' },
            { value: 'PAID', label: 'پرداخت‌شده' },
            { value: 'FAILED', label: 'ناموفق' },
            { value: 'CANCELLED', label: 'لغوشده' },
            { value: 'EXPIRED', label: 'منقضی‌شده' },
          ],
        },
      ]}
    />
  )
}
