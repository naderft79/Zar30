// ============================================
// Zar30 - Admin Transfer Detail (Client)
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AdminTransferDetail } from '@/lib/services/admin-ops.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { FinanceAction } from '@/components/admin/finance-action'
import {
  AuditTimeline,
  Field,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

export function AdminTransferDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: t,
    error,
    loading,
    reload,
  } = useAdminDetail<AdminTransferDetail>(
    `/api/v1/admin/transfers/${id}`,
    'transfer',
    'انتقال یافت نشد',
  )

  if (loading && !t) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری انتقال" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !t) {
    return (
      <div
        role="alert"
        className="border-error/30 bg-error/5 text-error flex items-center gap-2 rounded-xl border p-4 text-xs"
      >
        <IconAlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </div>
    )
  }
  if (!t) return null

  return (
    <div>
      <AdminPageHeader
        title="انتقال داخلی"
        eyebrow="معاملات و مالی — انتقال دارایی"
        description={`شناسه: ${t.id}`}
        actions={<AdminStatus status={t.status} />}
      />

      <div className="mb-4 flex flex-wrap items-start gap-2">
        {t.flagged ? (
          <FinanceAction
            label="برداشتن پرچم تقلب"
            endpoint={`/api/v1/admin/transfers/${t.id}/unflag`}
            tone="gold"
            onDone={reload}
          />
        ) : (
          <FinanceAction
            label="پرچم تقلب"
            endpoint={`/api/v1/admin/transfers/${t.id}/flag`}
            tone="danger"
            needsReason
            confirmText="انتقال به‌عنوان مشکوک علامت‌گذاری می‌شود — برگشت مالی جداگانه انجام می‌شود."
            onDone={reload}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات انتقال">
          <dl className="divide-border/40 divide-y">
            <Field
              label="مبلغ"
              value={
                t.assetType === 'GOLD' ? (
                  <FinancialValue value={t.goldAmount ?? '0'} unit="گرم" />
                ) : (
                  <FinancialValue value={t.tomanAmount ?? '0'} unit="تومان" />
                )
              }
            />
            <Field label="نوع" value={t.kind === 'GIFT' ? 'هدیه' : 'انتقال'} />
            {t.giftMessage && <Field label="پیام هدیه" value={t.giftMessage} />}
            <Field label="وضعیت" value={<AdminStatus status={t.status} />} />
            <Field label="شناسه سند" value={t.journalEntryId ?? '—'} />
            <Field label="زمان" value={fmtDate(t.createdAt)} />
          </dl>
        </Section>

        <div className="space-y-4">
          <Section title="طرفین">
            <dl className="divide-border/40 divide-y">
              <Field
                label="فرستنده"
                value={
                  <Link
                    href={`/admin/users/${t.sender.id}`}
                    className="text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    {t.sender.name}
                  </Link>
                }
              />
              <Field
                label="موبایل فرستنده"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {toPersianDigits(t.sender.mobile)}
                  </span>
                }
              />
              <Field
                label="گیرنده"
                value={
                  <Link
                    href={`/admin/users/${t.recipient.id}`}
                    className="text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    {t.recipient.name}
                  </Link>
                }
              />
              <Field
                label="موبایل گیرنده"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {toPersianDigits(t.recipient.mobile)}
                  </span>
                }
              />
            </dl>
          </Section>

          {t.flagged && (
            <Section title="پرچم تقلب">
              <dl className="divide-border/40 divide-y">
                <Field label="دلیل" value={t.flagReasonDetail ?? '—'} />
                <Field label="پرچم‌گذار" value={t.flaggedBy?.name ?? '—'} />
                <Field label="زمان" value={fmtDate(t.flaggedAt)} />
              </dl>
            </Section>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={t.audit} />
        </Section>
      </div>
    </div>
  )
}
