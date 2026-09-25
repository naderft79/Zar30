// ============================================
// Zar30 - Admin Bank Account Detail (Client)
// ============================================
// جزئیات کارت + اکشن‌های مسدود/رفع‌مسدودی/حذف
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AdminBankAccountDetail } from '@/lib/services/admin-ops.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { FinanceAction } from '@/components/admin/finance-action'
import {
  AuditTimeline,
  Field,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

export function AdminBankAccountDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: a,
    error,
    loading,
    reload,
  } = useAdminDetail<AdminBankAccountDetail>(
    `/api/v1/admin/bank-accounts/${id}`,
    'bankAccount',
    'کارت بانکی یافت نشد',
  )

  if (loading && !a) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری کارت" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !a) {
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
  if (!a) return null

  return (
    <div>
      <AdminPageHeader
        title="کارت بانکی کاربر"
        eyebrow="مشتریان — کارت‌های بانکی"
        description={`شناسه: ${a.id}`}
        actions={
          a.blocked ? (
            <span className="bg-error/10 text-error border-error/25 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
              مسدود
            </span>
          ) : (
            <span className="bg-success/10 text-success border-success/25 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
              فعال
            </span>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-start gap-2">
        {a.blocked ? (
          <FinanceAction
            label="رفع مسدودی"
            endpoint={`/api/v1/admin/bank-accounts/${a.id}/unblock`}
            tone="gold"
            confirmText="رفع مسدودی، استفاده از این کارت برای برداشت را دوباره فعال می‌کند."
            onDone={reload}
          />
        ) : (
          <FinanceAction
            label="مسدودسازی کارت"
            endpoint={`/api/v1/admin/bank-accounts/${a.id}/block`}
            tone="neutral"
            needsReason
            confirmText="کارت مسدود می‌شود و کاربر دیگر نمی‌تواند با آن برداشت کند. دلیل الزامی است."
            onDone={reload}
          />
        )}
        <FinanceAction
          label="حذف کارت"
          endpoint={`/api/v1/admin/bank-accounts/${a.id}/delete`}
          tone="danger"
          needsReason
          confirmText="کارت به‌طور کامل حذف می‌شود و قابل بازگشت نیست. دلیل الزامی است."
          onDone={reload}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات کارت">
          <dl className="divide-border/40 divide-y">
            <Field label="بانک" value={a.bankName} />
            <Field
              label="شماره کارت"
              value={
                <span className="tabular-nums" dir="ltr">
                  {a.cardPan ? toPersianDigits(a.cardPan) : '—'}
                </span>
              }
            />
            <Field
              label="شبا"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(a.iban)}
                </span>
              }
            />
            <Field label="نام مستعار" value={a.alias ?? '—'} />
            <Field label="پیش‌فرض" value={a.isDefault ? 'بله' : 'خیر'} />
            <Field label="دلیل مسدودی" value={a.blockNote ?? '—'} />
            <Field label="زمان ثبت" value={fmtDate(a.createdAt)} />
          </dl>
        </Section>

        <Section title="کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${a.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {a.user.name}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(a.user.mobile)}
                </span>
              }
            />
          </dl>
        </Section>
      </div>

      <div className="mt-4">
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={a.audit} />
        </Section>
      </div>
    </div>
  )
}
