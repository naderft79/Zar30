// ============================================
// Zar30 - Admin Payment Detail (Client)
// ============================================
// جزئیات پرداخت درگاه — read-only
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AdminPaymentDetail } from '@/lib/services/admin-ops.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { Field, Section, fmtDate, useAdminDetail } from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

export function AdminPaymentDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: p,
    error,
    loading,
  } = useAdminDetail<AdminPaymentDetail>(
    `/api/v1/admin/payments/${id}`,
    'payment',
    'پرداخت یافت نشد',
  )

  if (loading && !p) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری پرداخت" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !p) {
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
  if (!p) return null

  return (
    <div>
      <AdminPageHeader
        title="پرداخت درگاه"
        eyebrow="معاملات و مالی — پرداخت‌ها"
        description={`شناسه: ${p.id}`}
        actions={<AdminStatus status={p.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات پرداخت">
          <dl className="divide-border/40 divide-y">
            <Field label="مبلغ" value={<FinancialValue value={p.amount} unit="تومان" />} />
            <Field label="درگاه" value={p.gateway} />
            <Field label="وضعیت" value={<AdminStatus status={p.status} />} />
            <Field
              label="Authority"
              value={
                <span className="text-[11px] break-all tabular-nums" dir="ltr">
                  {p.authority ?? '—'}
                </span>
              }
            />
            <Field
              label="مرجع (RefId)"
              value={
                <span className="text-[11px] break-all tabular-nums" dir="ltr">
                  {p.refId ?? '—'}
                </span>
              }
            />
            <Field
              label="کارت پرداخت‌کننده"
              value={
                <span className="tabular-nums" dir="ltr">
                  {p.cardPanMasked ? toPersianDigits(p.cardPanMasked) : '—'}
                </span>
              }
            />
            <Field label="شرح" value={p.description ?? '—'} />
            <Field label="دلیل خطا" value={p.failureReason ?? '—'} />
            <Field label="شناسه تراکنش" value={p.transactionId ?? '—'} />
            <Field label="زمان تأیید" value={fmtDate(p.verifiedAt)} />
            <Field label="انقضا" value={fmtDate(p.expiresAt)} />
            <Field label="زمان ایجاد" value={fmtDate(p.createdAt)} />
          </dl>
        </Section>

        <Section title="کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${p.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {p.user.name}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(p.user.mobile)}
                </span>
              }
            />
          </dl>
        </Section>
      </div>
    </div>
  )
}
