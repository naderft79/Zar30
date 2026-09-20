// ============================================
// Zar30 - Admin Account Detail (Client)
// ============================================
// حساب دارایی + کیف پول/کاربر + آخرین ۵۰ ledger entry — read-only
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { AdminAccountDetail } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import {
  Field,
  LedgerEntriesTable,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

const ASSET_LABELS: Record<string, string> = {
  RIAL: 'ریال',
  GOLD: 'طلا',
  SILVER: 'نقره',
}

export function AdminAccountDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: account,
    error,
    loading,
  } = useAdminDetail<AdminAccountDetail>(`/api/v1/admin/accounts/${id}`, 'account', 'حساب یافت نشد')

  if (loading && !account) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری حساب" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !account) {
    return (
      <div
        role="alert"
        className="border-error/30 bg-error/5 text-error flex items-center gap-2 rounded-xl border p-4 text-xs"
      >
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </div>
    )
  }
  if (!account) return null

  const unit = account.assetType === 'RIAL' ? 'ریال' : 'گرم'

  return (
    <div>
      <AdminPageHeader
        title={`حساب ${ASSET_LABELS[account.assetType] ?? account.assetType}`}
        eyebrow="مالی — حساب‌های دارایی"
        description={`شناسه: ${account.id}`}
      />
      <ReadOnlyNotice className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="مانده حساب">
          <dl className="divide-border/40 divide-y">
            <Field label="مانده" value={<FinancialValue value={account.balance} unit={unit} />} />
            <Field
              label="مانده مسدود"
              value={<FinancialValue value={account.lockedBalance} unit={unit} />}
            />
            <Field label="دارایی" value={ASSET_LABELS[account.assetType] ?? account.assetType} />
            <Field label="ایجاد" value={fmtDate(account.createdAt)} />
            <Field label="به‌روزرسانی" value={fmtDate(account.updatedAt)} />
          </dl>
        </Section>

        <Section title="کیف پول و کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${account.wallet.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {[account.wallet.user.firstName, account.wallet.user.lastName]
                    .filter(Boolean)
                    .join(' ') || toPersianDigits(account.wallet.user.mobile)}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(account.wallet.user.mobile)}
                </span>
              }
            />
            <Field
              label="وضعیت حساب کاربر"
              value={<AdminStatus status={account.wallet.user.status} />}
            />
            <Field
              label="کیف پول"
              value={
                <Link
                  href={`/admin/wallets/${account.wallet.id}`}
                  className="text-gold-600 dark:text-gold-400 tabular-nums hover:underline"
                  dir="ltr"
                >
                  {account.wallet.id.slice(0, 8)}
                </Link>
              }
            />
            <Field label="وضعیت کیف پول" value={<AdminStatus status={account.wallet.status} />} />
          </dl>
        </Section>
      </div>

      <div className="mt-4">
        <Section
          title={`آخرین ورودی‌های ledger (${toPersianDigits(account.ledgerEntries.length)})`}
        >
          <LedgerEntriesTable entries={account.ledgerEntries} />
        </Section>
      </div>
    </div>
  )
}
