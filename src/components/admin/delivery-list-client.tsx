// ============================================
// Zar30 - Admin Delivery List (Client)
// ============================================

'use client'

import type { AdminDeliveryRow } from '@/lib/services/admin-delivery.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const METHOD_LABEL: Record<string, string> = { POST: 'ارسال پستی', PICKUP: 'تحویل حضوری' }

const columns: AdminColumn<AdminDeliveryRow>[] = [
  {
    key: 'id',
    header: 'شناسه',
    render: (d) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {d.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (d) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{d.user.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(d.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'grams',
    header: 'مقدار',
    render: (d) => <FinancialValue value={d.grams} unit="گرم" />,
  },
  {
    key: 'method',
    header: 'روش',
    render: (d) => (
      <span className="text-muted-foreground text-[11px]">
        {METHOD_LABEL[d.method] ?? d.method}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (d) => <AdminStatus status={d.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    mobile: false,
    render: (d) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(d.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminDeliveryClient() {
  return (
    <AdminFinanceList<AdminDeliveryRow>
      title="تحویل فیزیکی"
      eyebrow="محصولات"
      description="درخواست‌های تحویل فیزیکی طلا — طلا هنگام ثبت قفل شده است"
      endpoint="/api/v1/admin/delivery"
      dataKey="deliveries"
      columns={columns}
      keyOf={(d) => d.id}
      detailHref={(d) => `/admin/delivery/${d.id}`}
      searchPlaceholder="جستجو: شناسه، موبایل کاربر، کد رهگیری…"
      dateRange
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'PENDING', label: 'در انتظار' },
            { value: 'APPROVED', label: 'تاییدشده' },
            { value: 'PREPARING', label: 'در حال آماده‌سازی' },
            { value: 'SHIPPED', label: 'ارسال‌شده' },
            { value: 'DELIVERED', label: 'تحویل‌شده' },
            { value: 'REJECTED', label: 'ردشده' },
            { value: 'CANCELLED', label: 'لغوشده' },
          ],
        },
        {
          key: 'method',
          label: 'همه روش‌ها',
          options: [
            { value: 'POST', label: 'ارسال پستی' },
            { value: 'PICKUP', label: 'تحویل حضوری' },
          ],
        },
      ]}
    />
  )
}
