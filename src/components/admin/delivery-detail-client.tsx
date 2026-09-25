// ============================================
// Zar30 - Admin Delivery Detail (Client)
// ============================================
// درخواست تحویل فیزیکی — اکشن‌های مرحله‌ای approve/prepare/ship/deliver/reject
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AdminDeliveryDetail } from '@/lib/services/admin-delivery.service'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import { FinanceAction } from '@/components/admin/finance-action'
import { apiPost } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import {
  AuditTimeline,
  Field,
  Section,
  fmtDate,
  useAdminDetail,
} from '@/components/admin/detail-ui'
import { toPersianDigits } from '@/lib/utils/format'

const METHOD_LABEL: Record<string, string> = { POST: 'ارسال پستی', PICKUP: 'تحویل حضوری' }

// اکشن ارسال — نیاز به ورودی (کد رهگیری یا شعبه+زمان) دارد
function ShipAction({ id, method, onDone }: { id: string; method: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [pickupBranch, setPickupBranch] = useState('')
  const [pickupAt, setPickupAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    const payload =
      method === 'POST'
        ? { trackingCode: trackingCode.trim() }
        : {
            pickupBranch: pickupBranch.trim(),
            pickupAt: pickupAt ? new Date(pickupAt).toISOString() : '',
          }
    setBusy(true)
    setError(null)
    const res = await apiPost(`/api/v1/admin/delivery/${id}/ship`, payload)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    setOpen(false)
    onDone()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-gold-500 hover:bg-gold-600 text-navy-950 h-9 rounded-lg px-4 text-xs font-semibold transition-colors"
      >
        {method === 'POST' ? 'ثبت ارسال پستی' : 'ثبت زمان تحویل حضوری'}
      </button>
    )
  }
  return (
    <div className="border-border/60 bg-card space-y-3 rounded-xl border p-4">
      {method === 'POST' ? (
        <Input
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="کد رهگیری پستی"
          className="h-9 text-xs"
        />
      ) : (
        <>
          <Input
            value={pickupBranch}
            onChange={(e) => setPickupBranch(e.target.value)}
            placeholder="شعبه تحویل"
            className="h-9 text-xs"
          />
          <input
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
            className="border-border/60 bg-background text-foreground h-9 w-full rounded-lg border px-3 text-xs"
          />
        </>
      )}
      {error && (
        <p role="alert" className="text-error text-[11px]">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 h-8 rounded-lg px-4 text-xs font-semibold disabled:opacity-50"
        >
          {busy ? 'در حال انجام…' : 'تایید نهایی'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
        >
          انصراف
        </button>
      </div>
    </div>
  )
}

export function AdminDeliveryDetailClient() {
  const { id } = useParams<{ id: string }>()
  const {
    data: d,
    error,
    loading,
    reload,
  } = useAdminDetail<AdminDeliveryDetail>(
    `/api/v1/admin/delivery/${id}`,
    'delivery',
    'درخواست تحویل یافت نشد',
  )

  if (loading && !d) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری تحویل" className="space-y-4">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="skeleton-shimmer h-72 rounded-xl" />
      </div>
    )
  }
  if (error && !d) {
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
  if (!d) return null

  const actionables =
    d.status === 'PENDING' ||
    d.status === 'APPROVED' ||
    d.status === 'PREPARING' ||
    d.status === 'SHIPPED'

  return (
    <div>
      <AdminPageHeader
        title="درخواست تحویل فیزیکی"
        eyebrow="محصولات — تحویل فیزیکی"
        description={`شناسه: ${d.id}`}
        actions={<AdminStatus status={d.status} />}
      />

      {actionables && (
        <div className="mb-4 flex flex-wrap items-start gap-2">
          {d.status === 'PENDING' && (
            <FinanceAction
              label="تایید درخواست"
              endpoint={`/api/v1/admin/delivery/${d.id}/approve`}
              tone="gold"
              onDone={reload}
            />
          )}
          {d.status === 'APPROVED' && (
            <FinanceAction
              label="شروع آماده‌سازی"
              endpoint={`/api/v1/admin/delivery/${d.id}/prepare`}
              tone="gold"
              onDone={reload}
            />
          )}
          {d.status === 'PREPARING' && <ShipAction id={d.id} method={d.method} onDone={reload} />}
          {d.status === 'SHIPPED' && (
            <FinanceAction
              label="ثبت تحویل نهایی"
              endpoint={`/api/v1/admin/delivery/${d.id}/deliver`}
              tone="gold"
              confirmText="تحویل نهایی، طلای قفل‌شده کاربر را از حساب تسویه می‌کند. ادامه می‌دهید؟"
              onDone={reload}
            />
          )}
          {d.status !== 'SHIPPED' && (
            <FinanceAction
              label="رد درخواست"
              endpoint={`/api/v1/admin/delivery/${d.id}/reject`}
              tone="danger"
              needsReason
              confirmText="رد درخواست، طلای قفل‌شده و هزینه تحویل را به کاربر برمی‌گرداند."
              onDone={reload}
            />
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="جزئیات درخواست">
          <dl className="divide-border/40 divide-y">
            <Field label="مقدار طلا" value={<FinancialValue value={d.grams} unit="گرم" />} />
            <Field label="روش تحویل" value={METHOD_LABEL[d.method] ?? d.method} />
            <Field
              label="هزینه تحویل"
              value={d.feeToman ? <FinancialValue value={d.feeToman} unit="تومان" /> : 'رایگان'}
            />
            <Field label="وضعیت" value={<AdminStatus status={d.status} />} />
            <Field label="کد رهگیری" value={d.trackingCode ?? '—'} />
            {d.method === 'PICKUP' && (
              <>
                <Field label="شعبه تحویل" value={d.pickupBranch ?? '—'} />
                <Field label="زمان تحویل" value={fmtDate(d.pickupAt)} />
              </>
            )}
            <Field label="یادداشت بررسی" value={d.reviewNote ?? '—'} />
            <Field label="زمان ثبت" value={fmtDate(d.createdAt)} />
            <Field label="زمان پردازش" value={fmtDate(d.processedAt)} />
            <Field label="پردازش‌کننده" value={d.processedBy?.name ?? '—'} />
          </dl>
        </Section>

        <div className="space-y-4">
          <Section title="کاربر">
            <dl className="divide-border/40 divide-y">
              <Field
                label="کاربر"
                value={
                  <Link
                    href={`/admin/users/${d.user.id}`}
                    className="text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    {d.user.name}
                  </Link>
                }
              />
              <Field
                label="موبایل"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {toPersianDigits(d.user.mobile)}
                  </span>
                }
              />
            </dl>
          </Section>

          {d.address && (
            <Section title="آدرس تحویل">
              <dl className="divide-border/40 divide-y">
                <Field label="گیرنده" value={d.address.recipientName} />
                <Field
                  label="موبایل گیرنده"
                  value={
                    <span className="tabular-nums" dir="ltr">
                      {toPersianDigits(d.address.mobile)}
                    </span>
                  }
                />
                <Field
                  label="استان / شهر"
                  value={[d.address.province, d.address.city].filter(Boolean).join(' — ') || '—'}
                />
                <Field label="نشانی" value={d.address.address} />
                <Field
                  label="کد پستی"
                  value={
                    <span className="tabular-nums" dir="ltr">
                      {toPersianDigits(d.address.postalCode)}
                    </span>
                  }
                />
              </dl>
            </Section>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Section title="رویدادهای ممیزی">
          <AuditTimeline rows={d.audit} />
        </Section>
      </div>
    </div>
  )
}
