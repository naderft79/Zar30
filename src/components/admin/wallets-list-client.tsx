// ============================================
// Zar30 - Admin Wallets List (Client)
// ============================================

'use client'

import type { AdminWalletListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'

const ASSET_LABELS: Record<string, string> = {
  RIAL: 'ریال',
  GOLD: 'طلا',
  SILVER: 'نقره',
}

const columns: AdminColumn<AdminWalletListRow>[] = [
  {
    key: 'id',
    header: 'شناسه کیف پول',
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
    key: 'status',
    header: 'وضعیت',
    render: (w) => <AdminStatus status={w.status} />,
  },
  {
    key: 'accounts',
    header: 'حساب‌های دارایی',
    render: (w) => (
      <div className="space-y-1">
        {w.accounts.length === 0 && <span className="text-muted-foreground text-[11px]">—</span>}
        {w.accounts.map((a) => (
          <span key={a.assetType} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">
              {ASSET_LABELS[a.assetType] ?? a.assetType}:
            </span>
            <FinancialValue value={a.balance} />
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: 'ایجاد',
    mobile: false,
    render: (w) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(w.createdAt).toLocaleDateString('fa-IR')}
      </span>
    ),
  },
]

export function AdminWalletsClient() {
  return (
    <AdminFinanceList<AdminWalletListRow>
      title="کیف پول‌ها"
      eyebrow="مالی"
      description="کیف پول و حساب‌های دارایی کاربران — فقط خواندنی"
      endpoint="/api/v1/admin/wallets"
      dataKey="wallets"
      columns={columns}
      keyOf={(w) => w.id}
      detailHref={(w) => `/admin/wallets/${w.id}`}
      searchPlaceholder="جستجو: شناسه کیف پول، موبایل، نام…"
      filters={[
        {
          key: 'status',
          label: 'همه وضعیت‌ها',
          options: [
            { value: 'active', label: 'فعال' },
            { value: 'frozen', label: 'مسدود' },
          ],
        },
      ]}
    />
  )
}
