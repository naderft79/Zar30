// ============================================
// Zar30 - Admin Addresses List (Client)
// ============================================
// آدرس‌های تحویل فیزیکی کاربران — read-only
// ============================================

'use client'

import type { AdminAddressRow } from '@/lib/services/admin-ops.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { toPersianDigits } from '@/lib/utils/format'

const columns: AdminColumn<AdminAddressRow>[] = [
  {
    key: 'user',
    header: 'کاربر',
    render: (a) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{a.user.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(a.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'recipient',
    header: 'گیرنده',
    render: (a) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{a.recipientName}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(a.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'region',
    header: 'استان / شهر',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px]">
        {[a.province, a.city].filter(Boolean).join(' — ') || '—'}
      </span>
    ),
  },
  {
    key: 'address',
    header: 'نشانی',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground block max-w-[280px] truncate text-[11px]">
        {a.address}
      </span>
    ),
  },
  {
    key: 'postal',
    header: 'کد پستی',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {toPersianDigits(a.postalCode)}
      </span>
    ),
  },
  {
    key: 'deliveries',
    header: 'تحویل‌ها',
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {toPersianDigits(String(a.deliveriesCount))}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'ثبت',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(a.createdAt).toLocaleDateString('fa-IR')}
      </span>
    ),
  },
]

export function AdminAddressesClient() {
  return (
    <AdminFinanceList<AdminAddressRow>
      title="آدرس‌ها"
      eyebrow="مشتریان"
      description="آدرس‌های تحویل فیزیکی کاربران — فقط مشاهده"
      endpoint="/api/v1/admin/addresses"
      dataKey="addresses"
      columns={columns}
      keyOf={(a) => a.id}
      searchPlaceholder="جستجو: گیرنده، موبایل، کد پستی، موبایل کاربر…"
    />
  )
}
