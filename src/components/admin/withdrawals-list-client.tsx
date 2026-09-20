// ============================================
// Zar30 - Admin Withdrawals List (Client)
// ============================================

'use client'

import type { AdminWithdrawalListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const columns: AdminColumn<AdminWithdrawalListRow>[] = [
  {
    key: 'id',
    header: 'شناسه',
    render: (w) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {w.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (w) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">
          {[w.user.firstName, w.user.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(w.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (w) => <FinancialValue value={w.amount} unit="ریال" />,
  },
  {
    key: 'iban',
    header: 'شبا',
    render: (w) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {w.ibanMasked}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (w) => <AdminStatus status={w.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    mobile: false,
    render: (w) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(w.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminWithdrawalsClient() {
  return (
    <AdminFinanceList<AdminWithdrawalListRow>
      title="برداشت‌ها"
      eyebrow="مالی"
      description="درخواست‌های برداشت وجه — فقط خواندنی؛ شبا ماسک شده"
      endpoint="/api/v1/admin/withdrawals"
      dataKey="withdrawals"
      columns={columns}
      keyOf={(w) => w.id}
      detailHref={(w) => `/admin/withdrawals/${w.id}`}
      searchPlaceholder="جستجو: شناسه درخواست، موبایل کاربر…"
      dateRange
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار' },
            { value: 'APPROVED', label: 'تاییدشده' },
            { value: 'REJECTED', label: 'ردشده' },
            { value: 'PAID', label: 'پرداخت‌شده' },
            { value: 'FAILED', label: 'ناموفق' },
          ],
        },
      ]}
    />
  )
}
