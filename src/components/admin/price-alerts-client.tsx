// ============================================
// Zar30 - Admin Price Alerts Client
// ============================================
// هشدارهای قیمت کاربران — read-only رصد
// ============================================

'use client'

import Link from 'next/link'
import { formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import { AdminStatus } from '@/components/admin/admin-status'

interface AlertRow {
  id: string
  targetPrice: string
  direction: string
  active: boolean
  triggeredAt: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export function AdminPriceAlertsClient() {
  return (
    <AdminFinanceList<AlertRow>
      title="هشدارهای قیمت"
      description="هشدارهای قیمت طلای ثبت‌شده توسط کاربران — read-only"
      endpoint="/api/v1/admin/price-alerts"
      dataKey="alerts"
      keyOf={(a) => a.id}
      searchPlaceholder="کاربر (موبایل/نام)…"
      filters={[
        {
          key: 'alertDirection',
          label: 'جهت',
          options: [
            { value: 'ABOVE', label: 'بالای قیمت' },
            { value: 'BELOW', label: 'زیر قیمت' },
          ],
        },
        {
          key: 'status',
          label: 'وضعیت',
          options: [
            { value: 'active', label: 'فعال' },
            { value: 'triggered', label: 'فعال‌شده' },
            { value: 'inactive', label: 'غیرفعال' },
          ],
        },
      ]}
      columns={[
        {
          key: 'user',
          header: 'کاربر',
          render: (a) => (
            <Link href={`/admin/users/${a.user.id}`} className="font-medium hover:underline">
              {a.user.name}
            </Link>
          ),
        },
        {
          key: 'target',
          header: 'قیمت هدف',
          render: (a) => `${formatToman(a.targetPrice)} تومان`,
        },
        {
          key: 'dir',
          header: 'جهت',
          render: (a) => (a.direction === 'ABOVE' ? 'عبور از سقف' : 'کاهش به کف'),
        },
        {
          key: 'status',
          header: 'وضعیت',
          render: (a) => (
            <AdminStatus status={a.triggeredAt ? 'COMPLETED' : a.active ? 'ACTIVE' : 'SUSPENDED'} />
          ),
        },
        {
          key: 'triggered',
          header: 'زمان فعال‌شدن',
          render: (a) =>
            a.triggeredAt ? new Date(a.triggeredAt).toLocaleDateString('fa-IR') : '—',
          mobile: false,
        },
        {
          key: 'created',
          header: 'ایجاد',
          render: (a) => new Date(a.createdAt).toLocaleDateString('fa-IR'),
          mobile: false,
        },
      ]}
      emptyMessage="هشداری یافت نشد"
    />
  )
}
