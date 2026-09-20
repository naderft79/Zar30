// ============================================
// Zar30 - Admin Wallet Detail (Client)
// ============================================
// کیف پول + حساب‌های دارایی + آخرین ۵۰ تراکنش — read-only
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { AdminWalletDetail } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import { Field, Section, fmtDate, useAdminDetail } from '@/components/admin/detail-ui'
import { AdminDataTable, type AdminColumn } from '@/components/admin/admin-data-table'
import { toPersianDigits } from '@/lib/utils/format'
import { TX_TYPE_LABELS } from '@/components/admin/transactions-list-client'
import type { AdminTransactionListRow } from '@/lib/services/admin-finance.service'

const ASSET_LABELS: Record<string, string> = {
  RIAL: 'ریال',
  GOLD: 'طلا',
  SILVER: 'نقره',
}

const txColumns: AdminColumn<AdminTransactionListRow>[] = [
  {
    key: 'id',
    header: 'شناسه',
    render: (t) => (
      <span className="text-muted-foreground text-[11px] tabular-nums" dir="ltr">
        {t.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'type',
    header: 'نوع',
    render: (t) => TX_TYPE_LABELS[t.type] ?? t.type,
  },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (t) => <FinancialValue value={t.amount} unit="ریال" />,
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (t) => <AdminStatus status={t.status} />,
  },
  {
    key: 'createdAt',
    header: 'زمان',
    render: (t) => (
      <span className="text-muted-foreground text-[11px] tabular-nums">{fmtDate(t.createdAt)}</span>
    ),
  },
]

export function AdminWalletDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: wallet,
    error,
    loading,
  } = useAdminDetail<AdminWalletDetail>(`/api/v1/admin/wallets/${id}`, 'wallet', 'کیف پول یافت نشد')

  if (loading && !wallet) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری کیف پول" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !wallet) {
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
  if (!wallet) return null

  return (
    <div>
      <AdminPageHeader
        title="کیف پول"
        eyebrow="مالی — کیف پول‌ها"
        description={`شناسه: ${wallet.id}`}
        actions={<AdminStatus status={wallet.status} />}
      />
      <ReadOnlyNotice className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${wallet.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {[wallet.user.firstName, wallet.user.lastName].filter(Boolean).join(' ') ||
                    toPersianDigits(wallet.user.mobile)}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(wallet.user.mobile)}
                </span>
              }
            />
            <Field label="ایجاد کیف پول" value={fmtDate(wallet.createdAt)} />
            <Field label="به‌روزرسانی" value={fmtDate(wallet.updatedAt)} />
          </dl>
        </Section>

        <Section title="حساب‌های دارایی">
          {wallet.accounts.length === 0 ? (
            <p className="text-muted-foreground text-xs">حساب دارایی ندارد</p>
          ) : (
            <dl className="divide-border/40 divide-y">
              {wallet.accounts.map((a) => (
                <Field
                  key={a.assetType}
                  label={ASSET_LABELS[a.assetType] ?? a.assetType}
                  value={
                    <span>
                      <FinancialValue
                        value={a.balance}
                        unit={a.assetType === 'RIAL' ? 'ریال' : 'گرم'}
                      />
                      <span className="text-muted-foreground block text-[10px]">
                        مسدود: <FinancialValue value={a.lockedBalance} />
                      </span>
                    </span>
                  }
                />
              ))}
            </dl>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section title={`تراکنش‌های اخیر (${toPersianDigits(wallet.transactions.length)})`}>
          <AdminDataTable
            columns={txColumns}
            rows={wallet.transactions}
            keyOf={(t) => t.id}
            emptyMessage="تراکنشی ثبت نشده است"
            rowHref={(t) => `/admin/transactions/${t.id}`}
          />
        </Section>
      </div>
    </div>
  )
}
