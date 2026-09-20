// ============================================
// Zar30 - Admin Transaction Detail (Client)
// ============================================
// زنجیره دقیق: User Action → Transaction → Journal → Ledger Entries
// → Balance Effect (فقط balanceAfter موجود) → Audit
// Notification: رابط مستقیم در schema نیست — unavailable صریح
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, BellOff } from 'lucide-react'
import type { AdminTransactionDetail } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import {
  AuditTimeline,
  Field,
  JournalBlock,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'
import { TX_TYPE_LABELS } from '@/components/admin/transactions-list-client'

export function AdminTransactionDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: tx,
    error,
    loading,
  } = useAdminDetail<AdminTransactionDetail>(
    `/api/v1/admin/transactions/${id}`,
    'transaction',
    'تراکنش یافت نشد',
  )

  if (loading && !tx) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری تراکنش" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !tx) {
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
  if (!tx) return null

  return (
    <div>
      <AdminPageHeader
        title={`تراکنش ${TX_TYPE_LABELS[tx.type] ?? tx.type}`}
        eyebrow="مالی — تراکنش‌ها"
        description={`شناسه: ${tx.id}`}
        actions={<AdminStatus status={tx.status} />}
      />
      <ReadOnlyNotice className="mb-4" />

      {/* ===== زنجیره رویداد مالی ===== */}
      <ol className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
        {['اقدام کاربر', 'تراکنش', 'سند حسابداری', 'ورودی‌های ledger', 'اثر مانده', 'ممیزی'].map(
          (step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-medium">
                {toPersianDigits(i + 1)}. {step}
              </span>
              {i < 5 && <span className="text-muted-foreground">←</span>}
            </li>
          ),
        )}
      </ol>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="اقدام کاربر و تراکنش">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${tx.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {[tx.user.firstName, tx.user.lastName].filter(Boolean).join(' ') ||
                    toPersianDigits(tx.user.mobile)}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(tx.user.mobile)}
                </span>
              }
            />
            <Field label="نوع" value={TX_TYPE_LABELS[tx.type] ?? tx.type} />
            <Field label="مبلغ" value={<FinancialValue value={tx.amount} unit="ریال" />} />
            <Field label="وضعیت" value={<AdminStatus status={tx.status} />} />
            <Field
              label="کیف پول"
              value={
                tx.wallet ? (
                  <Link
                    href={`/admin/wallets/${tx.wallet.id}`}
                    className="text-gold-600 dark:text-gold-400 tabular-nums hover:underline"
                    dir="ltr"
                  >
                    {tx.wallet.id.slice(0, 8)} — <AdminStatus status={tx.wallet.status} />
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <Field
              label="ارجاع درگاه"
              value={
                <span className="tabular-nums" dir="ltr">
                  {tx.gatewayRef ?? '—'}
                </span>
              }
            />
            <Field
              label="ارجاع بانکی"
              value={
                <span className="tabular-nums" dir="ltr">
                  {tx.bankRef ?? '—'}
                </span>
              }
            />
            <Field label="زمان ثبت" value={fmtDate(tx.createdAt)} />
          </dl>
        </Section>

        <Section title="سند حسابداری و اثر مانده">
          {tx.journal ? (
            <JournalBlock journal={tx.journal} />
          ) : (
            <p className="text-muted-foreground text-xs">
              سند حسابداری برای این تراکنش ثبت نشده است
            </p>
          )}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="اعلان">
          <div className="border-border/60 text-muted-foreground flex items-start gap-2.5 rounded-lg border border-dashed p-3 text-xs leading-5">
            <BellOff className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <p>
              رابط مستقیم اعلان↔تراکنش در schema ثبت نشده است — نمایش اعلان مرتبط در دسترس نیست.
            </p>
          </div>
        </Section>
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={tx.audit} />
        </Section>
      </div>
    </div>
  )
}
