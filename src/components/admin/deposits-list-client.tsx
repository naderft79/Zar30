// ============================================
// Zar30 - Admin Deposits List (Client)
// ============================================
// منبع داده: Transaction(type=DEPOSIT) — مدل جداگانه وجود ندارد
// ============================================

'use client'

import type { AdminTransactionListRow } from '@/lib/services/admin-finance.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import { transactionColumns } from '@/components/admin/transactions-list-client'

export function AdminDepositsClient() {
  return (
    <AdminFinanceList<AdminTransactionListRow>
      title="واریزها"
      eyebrow="مالی"
      description="منبع داده: تراکنش‌ها (type=DEPOSIT) — فقط خواندنی"
      endpoint="/api/v1/admin/deposits"
      dataKey="deposits"
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
      ]}
    />
  )
}
