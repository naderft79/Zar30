// ============================================
// Zar30 - Admin Bank Accounts List (Client)
// ============================================

'use client'

import type { AdminBankAccountRow } from '@/lib/services/admin-ops.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { toPersianDigits } from '@/lib/utils/format'

const columns: AdminColumn<AdminBankAccountRow>[] = [
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
    key: 'bank',
    header: 'بانک',
    render: (a) => <span className="text-foreground text-xs">{a.bankName}</span>,
  },
  {
    key: 'card',
    header: 'شماره کارت',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {a.cardPanMasked ? toPersianDigits(a.cardPanMasked) : '—'}
      </span>
    ),
  },
  {
    key: 'iban',
    header: 'شبا',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {toPersianDigits(a.ibanMasked)}
      </span>
    ),
  },
  {
    key: 'flags',
    header: 'وضعیت',
    render: (a) => (
      <div className="flex flex-wrap gap-1">
        {a.blocked ? (
          <span className="bg-error/10 text-error border-error/25 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
            مسدود
          </span>
        ) : (
          <span className="bg-success/10 text-success border-success/25 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
            فعال
          </span>
        )}
        {a.isDefault && (
          <span className="bg-muted text-muted-foreground border-border/60 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px]">
            پیش‌فرض
          </span>
        )}
      </div>
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

export function AdminBankAccountsClient() {
  return (
    <AdminFinanceList<AdminBankAccountRow>
      title="کارت‌های بانکی"
      eyebrow="مشتریان"
      description="کارت‌ها و شباهای ثبت‌شده کاربران — مسدودسازی/حذف از صفحه جزئیات"
      endpoint="/api/v1/admin/bank-accounts"
      dataKey="bankAccounts"
      columns={columns}
      keyOf={(a) => a.id}
      detailHref={(a) => `/admin/bank-accounts/${a.id}`}
      searchPlaceholder="جستجو: موبایل کاربر، شبا، شماره کارت…"
      filters={[
        {
          key: 'blocked',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'true', label: 'مسدود' },
            { value: 'false', label: 'فعال' },
          ],
        },
      ]}
    />
  )
}
