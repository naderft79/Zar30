// ============================================
// Zar30 - Admin Order Detail (Client)
// ============================================
// سفارش + journal/ledger + audit timeline — read-only
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { AdminOrderDetail } from '@/lib/services/admin-finance.service'
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

export function AdminOrderDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: order,
    error,
    loading,
  } = useAdminDetail<AdminOrderDetail>(`/api/v1/admin/orders/${id}`, 'order', 'سفارش یافت نشد')

  if (loading && !order) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری سفارش" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !order) {
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
  if (!order) return null

  return (
    <div>
      <AdminPageHeader
        title={`سفارش ${order.type === 'BUY' ? 'خرید' : 'فروش'} طلا`}
        eyebrow="مالی — سفارش‌ها"
        description={`شناسه: ${order.id}`}
        actions={<AdminStatus status={order.status} />}
      />
      <ReadOnlyNotice className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات سفارش">
          <dl className="divide-border/40 divide-y">
            <Field label="نوع" value={order.type === 'BUY' ? 'خرید' : 'فروش'} />
            <Field
              label="مقدار طلا"
              value={<FinancialValue value={order.goldAmount} unit="گرم" />}
            />
            <Field
              label="مبلغ ریالی"
              value={<FinancialValue value={order.rialAmount} unit="ریال" />}
            />
            <Field
              label="قیمت واحد"
              value={<FinancialValue value={order.unitPrice} unit="ریال" />}
            />
            <Field label="اسپرد" value={<FinancialValue value={order.spread} />} />
            <Field label="کارمزد" value={<FinancialValue value={order.fee} unit="ریال" />} />
            <Field label="مبلغ کل" value={<FinancialValue value={order.total} unit="ریال" />} />
            <Field label="تایید OTP" value={order.otpConfirmed ? 'انجام‌شده' : 'انجام‌نشده'} />
            <Field label="انقضای قفل قیمت" value={fmtDate(order.priceLockExpiresAt)} />
            <Field label="زمان ایجاد" value={fmtDate(order.createdAt)} />
          </dl>
        </Section>

        <Section title="کاربر">
          <dl className="divide-border/40 divide-y">
            <Field
              label="کاربر"
              value={
                <Link
                  href={`/admin/users/${order.user.id}`}
                  className="text-gold-600 dark:text-gold-400 hover:underline"
                >
                  {[order.user.firstName, order.user.lastName].filter(Boolean).join(' ') ||
                    toPersianDigits(order.user.mobile)}
                </Link>
              }
            />
            <Field
              label="موبایل"
              value={
                <span className="tabular-nums" dir="ltr">
                  {toPersianDigits(order.user.mobile)}
                </span>
              }
            />
          </dl>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="سند حسابداری (journal + ledger)">
          {order.journal ? (
            <JournalBlock journal={order.journal} />
          ) : (
            <p className="text-muted-foreground text-xs">
              سند حسابداری برای این سفارش ثبت نشده است
            </p>
          )}
        </Section>
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={order.audit} />
        </Section>
      </div>
    </div>
  )
}
