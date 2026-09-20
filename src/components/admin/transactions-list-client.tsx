// ============================================
// Zar30 - Admin Transactions List (Client)
// ============================================

'use client'

import type { AdminTransactionListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

export const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAW: 'برداشت',
  FEE: 'کارمزد',
  TRANSFER: 'انتقال',
}

export const transactionColumns: AdminColumn<AdminTransactionListRow>[] = [
  {
    key: 'id',
    header: 'شناسه تراکنش',
    render: (t) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {t.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'type',
    header: 'نوع',
    render: (t) => (
      <span className="text-foreground font-medium">{TX_TYPE_LABELS[t.type] ?? t.type}</span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (t) => (
      <span className="text-[11px] tabular-nums" dir="ltr">
        {toPersianDigits(t.user.mobile)}
      </span>
    ),
  },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (t) => <FinancialValue value={t.amount} unit="ریال" />,
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (t) => <AdminStatus status={t.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    render: (t) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(t.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminTransactionsClient() {
  return (
    <AdminFinanceList<AdminTransactionListRow>
      title="تراکنش‌ها"
      eyebrow="مالی"
      description="همه تراکنش‌های مالی — فقط خواندنی"
      endpoint="/api/v1/admin/transactions"
      dataKey="transactions"
      columns={transactionColumns}
      keyOf={(t) => t.id}
      detailHref={(t) => `/admin/transactions/${t.id}`}
      searchPlaceholder="جستجو: شناسه تراکنش، موبایل کاربر…"
      dateRange
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار' },
            { value: 'COMPLETED', label: 'موفق' },
            { value: 'FAILED', label: 'ناموفق' },
            { value: 'REVERSED', label: 'برگشت‌خورده' },
          ],
        },
        {
          key: 'type',
          label: 'همه انواع',
          options: [
            { value: 'DEPOSIT', label: 'واریز' },
            { value: 'WITHDRAW', label: 'برداشت' },
            { value: 'FEE', label: 'کارمزد' },
            { value: 'TRANSFER', label: 'انتقال' },
          ],
        },
      ]}
    />
  )
}
