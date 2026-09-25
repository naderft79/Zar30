// ============================================
// Zar30 - Admin Exports Client
// ============================================
// تاریخچه خروجی‌های CSV
// ============================================

'use client'

import { toPersianDigits } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'

interface ExportRow {
  id: string
  kind: string
  rowCount: number
  createdAt: string
  admin: { name: string }
  from?: string | null
  to?: string | null
}

const KIND_LABELS: Record<string, string> = {
  orders: 'سفارش‌ها',
  transactions: 'تراکنش‌ها',
  withdrawals: 'برداشت‌ها',
  users: 'کاربران',
  transfers: 'انتقال‌ها',
  payments: 'پرداخت‌ها',
}

export function AdminExportsClient() {
  return (
    <AdminFinanceList<ExportRow>
      title="تاریخچه خروجی‌ها"
      description="همه خروجی‌های گرفته‌شده — چه کسی، چه داده‌ای، چند رکورد"
      endpoint="/api/v1/admin/exports"
      dataKey="exports"
      keyOf={(e) => e.id}
      searchPlaceholder="نوع خروجی…"
      readOnlyNotice
      columns={[
        {
          key: 'kind',
          header: 'نوع',
          render: (e) => KIND_LABELS[e.kind] ?? e.kind,
        },
        { key: 'admin', header: 'ادمین', render: (e) => e.admin.name },
        {
          key: 'rows',
          header: 'رکورد',
          render: (e) => toPersianDigits(e.rowCount),
        },
        {
          key: 'range',
          header: 'بازه',
          render: (e) =>
            e.from || e.to
              ? `${e.from ? new Date(e.from).toLocaleDateString('fa-IR') : '…'} تا ${e.to ? new Date(e.to).toLocaleDateString('fa-IR') : '…'}`
              : 'همه',
          mobile: false,
        },
        {
          key: 'created',
          header: 'زمان',
          render: (e) => new Date(e.createdAt).toLocaleString('fa-IR'),
        },
      ]}
      emptyMessage="خروجی‌ای ثبت نشده است"
    />
  )
}
