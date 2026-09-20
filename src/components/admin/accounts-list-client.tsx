// ============================================
// Zar30 - Admin Accounts List (Client)
// ============================================

'use client'

import type { AdminAccountListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const ASSET_LABELS: Record<string, string> = {
  RIAL: 'ریال',
  GOLD: 'طلا',
  SILVER: 'نقره',
}

const columns: AdminColumn<AdminAccountListRow>[] = [
  {
    key: 'id',
    header: 'شناسه حساب',
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {a.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'asset',
    header: 'دارایی',
    render: (a) => (
      <span className="text-foreground font-medium">
        {ASSET_LABELS[a.assetType] ?? a.assetType}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'کاربر',
    render: (a) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">
          {[a.wallet.user.firstName, a.wallet.user.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(a.wallet.user.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'balance',
    header: 'مانده',
    render: (a) => (
      <FinancialValue value={a.balance} unit={a.assetType === 'RIAL' ? 'ریال' : 'گرم'} />
    ),
  },
  {
    key: 'locked',
    header: 'مسدود',
    render: (a) => <FinancialValue value={a.lockedBalance} />,
  },
  {
    key: 'updatedAt',
    header: 'به‌روزرسانی',
    mobile: false,
    render: (a) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(a.updatedAt).toLocaleDateString('fa-IR')}
      </span>
    ),
  },
]

export function AdminAccountsClient() {
  return (
    <AdminFinanceList<AdminAccountListRow>
      title="حساب‌های دارایی"
      eyebrow="مالی"
      description="همه حساب‌های دارایی کاربران — فقط خواندنی"
      endpoint="/api/v1/admin/accounts"
      dataKey="accounts"
      columns={columns}
      keyOf={(a) => a.id}
      detailHref={(a) => `/admin/accounts/${a.id}`}
      searchPlaceholder="جستجو: شناسه حساب/کیف پول، موبایل، نام…"
      filters={[
        {
          key: 'assetType',
          label: 'همه دارایی‌ها',
          options: [
            { value: 'RIAL', label: 'ریال' },
            { value: 'GOLD', label: 'طلا' },
            { value: 'SILVER', label: 'نقره' },
          ],
        },
      ]}
    />
  )
}
