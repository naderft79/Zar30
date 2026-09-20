// ============================================
// Zar30 - Admin Orders List (Client)
// ============================================

'use client'

import type { AdminOrderListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const columns: AdminColumn<AdminOrderListRow>[] = [
  {
    key: 'id',
    header: 'شناسه سفارش',
    render: (o) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {o.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'type',
    header: 'نوع',
    render: (o) => (
      <span className="text-foreground font-medium">{o.type === 'BUY' ? 'خرید' : 'فروش'}</span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (o) => (
      <span className="text-[11px] tabular-nums" dir="ltr">
        {toPersianDigits(o.user.mobile)}
      </span>
    ),
  },
  {
    key: 'gold',
    header: 'طلا (گرم)',
    render: (o) => <FinancialValue value={o.goldAmount} />,
  },
  {
    key: 'total',
    header: 'مبلغ کل',
    render: (o) => <FinancialValue value={o.total} unit="ریال" />,
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (o) => <AdminStatus status={o.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    render: (o) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(o.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminOrdersClient() {
  return (
    <AdminFinanceList<AdminOrderListRow>
      title="سفارش‌ها"
      eyebrow="مالی"
      description="سفارش‌های خرید/فروش طلا — فقط خواندنی"
      endpoint="/api/v1/admin/orders"
      dataKey="orders"
      columns={columns}
      keyOf={(o) => o.id}
      detailHref={(o) => `/admin/orders/${o.id}`}
      searchPlaceholder="جستجو: شناسه سفارش، موبایل کاربر…"
      dateRange
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار' },
            { value: 'LOCKED', label: 'قفل‌شده' },
            { value: 'FILLED', label: 'تکمیل‌شده' },
            { value: 'CANCELLED', label: 'لغوشده' },
            { value: 'FAILED', label: 'ناموفق' },
          ],
        },
        {
          key: 'type',
          label: 'همه انواع',
          options: [
            { value: 'BUY', label: 'خرید' },
            { value: 'SELL', label: 'فروش' },
          ],
        },
      ]}
    />
  )
}
