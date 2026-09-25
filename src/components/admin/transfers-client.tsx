// ============================================
// Zar30 - Admin Transfers List (Client)
// ============================================

'use client'

import type { AdminTransferRow } from '@/lib/services/admin-ops.service'
import { AdminFinanceList } from '@/components/admin/finance-list'
import type { AdminColumn } from '@/components/admin/admin-data-table'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { toPersianDigits } from '@/lib/utils/format'
import { IconFlag } from '@tabler/icons-react'

const KIND_LABEL: Record<string, string> = { TRANSFER: 'انتقال', GIFT: 'هدیه' }

const columns: AdminColumn<AdminTransferRow>[] = [
  {
    key: 'sender',
    header: 'فرستنده',
    render: (t) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{t.sender.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(t.sender.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'recipient',
    header: 'گیرنده',
    render: (t) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs">{t.recipient.name}</span>
        <span className="text-muted-foreground block truncate text-[10px] tabular-nums" dir="ltr">
          {toPersianDigits(t.recipient.mobile)}
        </span>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (t) =>
      t.assetType === 'GOLD' ? (
        <FinancialValue value={t.goldAmount ?? '0'} unit="گرم" />
      ) : (
        <FinancialValue value={t.tomanAmount ?? '0'} unit="تومان" />
      ),
  },
  {
    key: 'kind',
    header: 'نوع',
    mobile: false,
    render: (t) => (
      <span className="text-muted-foreground text-[11px]">{KIND_LABEL[t.kind] ?? t.kind}</span>
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (t) => (
      <div className="flex items-center gap-1">
        <AdminStatus status={t.status} />
        {t.flagged && (
          <span
            title={t.flagReason ?? 'پرچم‌دار'}
            className="bg-error/10 text-error border-error/25 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
          >
            <IconFlag className="size-3" aria-hidden="true" />
            مشکوک
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: 'زمان',
    mobile: false,
    render: (t) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">
        {new Date(t.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    ),
  },
]

export function AdminTransfersClient() {
  return (
    <AdminFinanceList<AdminTransferRow>
      title="انتقال دارایی"
      eyebrow="معاملات و مالی"
      description="انتقال‌ها و هدایای داخلی بین کاربران — رصد و پرچم تقلب"
      endpoint="/api/v1/admin/transfers"
      dataKey="transfers"
      columns={columns}
      keyOf={(t) => t.id}
      detailHref={(t) => `/admin/transfers/${t.id}`}
      searchPlaceholder="جستجو: شناسه، موبایل فرستنده/گیرنده…"
      dateRange
      filters={[
        {
          key: 'kind',
          label: 'همه نوع‌ها',
          options: [
            { value: 'TRANSFER', label: 'انتقال' },
            { value: 'GIFT', label: 'هدیه' },
          ],
        },
        {
          key: 'flagged',
          label: 'همه',
          options: [{ value: 'true', label: 'پرچم‌دار' }],
        },
      ]}
    />
  )
}
