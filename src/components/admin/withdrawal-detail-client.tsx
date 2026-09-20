// ============================================
// Zar30 - Admin Withdrawal Detail (Client)
// ============================================
// درخواست برداشت — شبا فقط masked؛ بدون اکشن — read-only
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { AdminWithdrawalDetail } from '@/lib/services/admin-finance.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { ReadOnlyNotice } from '@/components/admin/read-only-notice'
import {
  AuditTimeline,
  Field,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

export function AdminWithdrawalDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: w,
    error,
    loading,
  } = useAdminDetail<AdminWithdrawalDetail>(
    `/api/v1/admin/withdrawals/${id}`,
    'withdrawal',
    'درخواست برداشت یافت نشد',
  )

  if (loading && !w) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری برداشت" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !w) {
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
  if (!w) return null

  const processorName = w.processor
    ? [w.processor.firstName, w.processor.lastName].filter(Boolean).join(' ') || w.processor.id
    : null

  return (
    <div>
      <AdminPageHeader
        title="درخواست برداشت"
        eyebrow="مالی — برداشت‌ها"
        description={`شناسه: ${w.id}`}
        actions={<AdminStatus status={w.status} />}
      />
      <ReadOnlyNotice className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات درخواست">
          <dl className="divide-border/40 divide-y">
            <Field label="مبلغ" value={<FinancialValue value={w.amount} unit="ریال" />} />
            <Field
              label="شبا"
              value={
                <span className="tabular-nums" dir="ltr">
                  {w.ibanMasked}
                </span>
              }
            />
            <Field label="وضعیت" value={<AdminStatus status={w.status} />} />
            <Field label="زمان ثبت" value={fmtDate(w.createdAt)} />
            <Field label="زمان پردازش" value={fmtDate(w.processedAt)} />
            <Field label="پردازش‌کننده" value={processorName ?? '—'} />
          </dl>
        </Section>

        <Section title="کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${w.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {[w.user.firstName, w.user.lastName].filter(Boolean).join(' ') ||
                    toPersianDigits(w.user.mobile)}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(w.user.mobile)}
                </span>
              }
            />
          </dl>
        </Section>
      </div>

      <div className="mt-4">
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={w.audit} />
        </Section>
      </div>
    </div>
  )
}
