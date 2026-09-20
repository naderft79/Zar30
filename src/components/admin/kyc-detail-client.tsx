// ============================================
// Zar30 - Admin KYC Detail (Client)
// ============================================
// بررسی پرونده — layout عملیاتی دوبخشی؛ مدارک از endpoint امن دانلود
// اکشن‌ها permission-aware: claim→kyc.review، approve→kyc.approve، reject→kyc.reject
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  FileX2,
  Landmark,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type { AdminKycDetail } from '@/lib/services/admin-kyc.service'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import { useAdmin } from '@/components/admin/admin-shell'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'

const KYC_LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'سطح ۰',
  LEVEL_1: 'سطح ۱',
  LEVEL_2: 'سطح ۲',
  LEVEL_3: 'سطح ۳',
}

const DOC_KIND_LABELS: Record<string, string> = {
  ID_CARD_FRONT: 'کارت ملی — روی',
  ID_CARD_BACK: 'کارت ملی — پشت',
  SELFIE: 'سلفی',
  VIDEO: 'ویدیوی احراز هویت',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-muted-foreground shrink-0 text-[11px]">{label}</dt>
      <dd className="text-foreground min-w-0 text-left text-xs">{value}</dd>
    </div>
  )
}

export function AdminKycDetailClient() {
  const { id } = useParams<{ id: string }>()
  const { admin } = useAdmin()
  const [detail, setDetail] = useState<AdminKycDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [dialog, setDialog] = useState<'approve' | 'reject' | 'request_changes' | null>(null)
  const [reason, setReason] = useState('')
  const [actionDone, setActionDone] = useState<string | null>(null)

  const canReview = hasPermission(admin.permissions, PERMISSIONS.KYC_REVIEW)
  const canApprove = hasPermission(admin.permissions, PERMISSIONS.KYC_APPROVE)
  const canReject = hasPermission(admin.permissions, PERMISSIONS.KYC_REJECT)

  // setState فقط بعد از await — مطابق rule react-hooks/set-state-in-effect
  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ submission: AdminKycDetail }>(`/api/v1/admin/kyc/${id}`)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'بارگذاری پرونده ناموفق بود')
      return
    }
    setError(null)
    setDetail(res.data!.submission)
  }, [id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ submission: AdminKycDetail }>(`/api/v1/admin/kyc/${id}`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری پرونده ناموفق بود')
        return
      }
      setError(null)
      setDetail(res.data!.submission)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function claim() {
    if (actionBusy) return
    setActionBusy(true)
    setActionError(null)
    const res = await apiPost(`/api/v1/admin/kyc/${id}/claim`)
    setActionBusy(false)
    if (!res.ok) {
      setActionError(res.error ?? 'گرفتن پرونده ناموفق بود')
      return
    }
    void load()
  }

  async function submitReview() {
    if (!dialog || actionBusy) return
    const needsReason = dialog !== 'approve'
    if (needsReason && reason.trim().length < 5) return
    setActionBusy(true)
    setActionError(null)
    const res = await apiPost(`/api/v1/admin/kyc/${id}/review`, {
      decision: dialog,
      reason: reason.trim() || undefined,
    })
    setActionBusy(false)
    if (!res.ok) {
      setActionError(res.error ?? 'ثبت تصمیم ناموفق بود')
      return
    }
    setDialog(null)
    setReason('')
    setActionDone('تصمیم با موفقیت ثبت شد.')
    void load()
  }

  if (loading && !detail) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری پرونده" className="space-y-4">
        <div className="skeleton-shimmer h-28 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="skeleton-shimmer h-80 rounded-xl lg:col-span-2" />
          <div className="skeleton-shimmer h-80 rounded-xl lg:col-span-3" />
        </div>
      </div>
    )
  }

  if (error && !detail) {
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
  if (!detail) return null

  const applicantName =
    [detail.firstName, detail.lastName].filter(Boolean).join(' ') ||
    [detail.user.firstName, detail.user.lastName].filter(Boolean).join(' ') ||
    detail.user.mobile
  const reviewerName = detail.reviewer
    ? [detail.reviewer.firstName, detail.reviewer.lastName].filter(Boolean).join(' ') ||
      detail.reviewer.id
    : null
  // تصمیم فقط برای پرونده UNDER_REVIEW که در اختیار همین ادمین است
  const isMine = detail.status === 'UNDER_REVIEW' && detail.reviewer?.id === admin.id
  const heldByOther = detail.status === 'UNDER_REVIEW' && !isMine

  return (
    <div>
      <AdminPageHeader
        title={applicantName}
        eyebrow="مشتریان — احراز هویت"
        description={`پرونده ${detail.id}`}
        actions={
          <div className="flex items-center gap-2">
            {detail.status === 'SUBMITTED' && canReview && (
              <ActionButton
                onClick={claim}
                busy={actionBusy}
                icon={<UserCheck className="size-4" />}
              >
                گرفتن برای بررسی
              </ActionButton>
            )}
            {isMine && canApprove && (
              <ActionButton
                onClick={() => setDialog('approve')}
                busy={actionBusy}
                tone="success"
                icon={<CheckCircle2 className="size-4" />}
              >
                تایید
              </ActionButton>
            )}
            {isMine && canReject && (
              <ActionButton
                onClick={() => setDialog('reject')}
                busy={actionBusy}
                tone="error"
                icon={<XCircle className="size-4" />}
              >
                رد
              </ActionButton>
            )}
            {isMine && canReview && (
              <ActionButton
                onClick={() => setDialog('request_changes')}
                busy={actionBusy}
                tone="warning"
                icon={<FileX2 className="size-4" />}
              >
                نیازمند اصلاح
              </ActionButton>
            )}
          </div>
        }
      />

      {actionError && (
        <p role="alert" className="text-error mb-4 text-xs">
          {actionError}
        </p>
      )}
      {actionDone && (
        <p role="status" className="text-success mb-4 flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {actionDone}
        </p>
      )}
      {heldByOther && (
        <p className="border-border/60 bg-muted/50 text-muted-foreground mb-4 rounded-xl border p-3 text-xs">
          پرونده در اختیار بررسی‌کننده دیگری است
          {reviewerName ? ` — ${reviewerName}` : ''}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ===== ستون راست — هویت و وضعیت ===== */}
        <div className="space-y-4 lg:col-span-2">
          <section className="bg-card border-border/60 rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-sm font-bold">وضعیت پرونده</h2>
              <AdminStatus status={detail.status} />
            </div>
            <dl className="divide-border/40 divide-y">
              <Field label="سطح درخواستی" value={KYC_LEVEL_LABELS[detail.level] ?? detail.level} />
              <Field label="گام فعلی" value={toPersianDigits(detail.currentStep)} />
              <Field label="ایجاد" value={fmtDate(detail.createdAt)} />
              <Field label="ارسال" value={fmtDate(detail.submittedAt)} />
              <Field label="بررسی" value={fmtDate(detail.reviewedAt)} />
              <Field label="بررسی‌کننده" value={reviewerName ?? '—'} />
              <Field label="آخرین به‌روزرسانی" value={fmtDate(detail.updatedAt)} />
            </dl>
            {detail.rejectionReason && (
              <div className="border-error/30 bg-error/5 mt-3 rounded-lg border p-3">
                <p className="text-error text-[11px] font-semibold">دلیل رد/بازگشت</p>
                <p className="text-foreground mt-1 text-xs leading-5">{detail.rejectionReason}</p>
              </div>
            )}
          </section>

          <section className="bg-card border-border/60 rounded-xl border p-5">
            <h2 className="text-foreground mb-3 text-sm font-bold">اطلاعات هویتی</h2>
            <dl className="divide-border/40 divide-y">
              <Field label="نام" value={detail.firstName ?? '—'} />
              <Field label="نام خانوادگی" value={detail.lastName ?? '—'} />
              <Field
                label="کد ملی"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {detail.nationalCode ?? '—'}
                  </span>
                }
              />
              <Field
                label="شماره شناسنامه"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {detail.shenasnamehNo ?? '—'}
                  </span>
                }
              />
              <Field
                label="تاریخ تولد"
                value={
                  detail.birthDate ? new Date(detail.birthDate).toLocaleDateString('fa-IR') : '—'
                }
              />
            </dl>
          </section>

          <section className="bg-card border-border/60 rounded-xl border p-5">
            <h2 className="text-foreground mb-3 flex items-center gap-2 text-sm font-bold">
              <Landmark
                className="text-muted-foreground size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              اطلاعات بانکی
            </h2>
            <dl className="divide-border/40 divide-y">
              <Field label="تکمیل بانکی" value={detail.bank.bankComplete ? 'کامل' : 'ناقص'} />
              <Field
                label="کارت"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {detail.bank.cardMasked ?? '—'}
                  </span>
                }
              />
              <Field
                label="شبا"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {detail.bank.ibanMasked ?? '—'}
                  </span>
                }
              />
            </dl>
          </section>
        </div>

        {/* ===== ستون چپ — حساب کاربر + مدارک ===== */}
        <div className="space-y-4 lg:col-span-3">
          <section className="bg-card border-border/60 rounded-xl border p-5">
            <h2 className="text-foreground mb-3 text-sm font-bold">حساب کاربر</h2>
            <dl className="divide-border/40 divide-y">
              <Field
                label="موبایل"
                value={
                  <span className="tabular-nums" dir="ltr">
                    {toPersianDigits(detail.user.mobile)}
                  </span>
                }
              />
              <Field
                label="سطح KYC حساب"
                value={KYC_LEVEL_LABELS[detail.user.kycLevel] ?? detail.user.kycLevel}
              />
              <Field label="وضعیت حساب" value={<AdminStatus status={detail.user.status} />} />
              <Field
                label="پروفایل کاربر"
                value={
                  <Link
                    href={`/admin/users/${detail.user.id}`}
                    className="text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    مشاهده جزئیات کاربر
                  </Link>
                }
              />
            </dl>
          </section>

          <section className="bg-card border-border/60 rounded-xl border p-5">
            <h2 className="text-foreground mb-3 text-sm font-bold">
              مدارک ({toPersianDigits(detail.documents.length)})
            </h2>
            {detail.documents.length === 0 ? (
              <p className="text-muted-foreground text-xs">مدرکی بارگذاری نشده است</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {detail.documents.map((d) => (
                  <li
                    key={d.id}
                    className="border-border/40 flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileImage
                        className="text-muted-foreground size-8 shrink-0"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-xs font-medium">
                          {DOC_KIND_LABELS[d.kind] ?? d.kind}
                        </p>
                        <p className="text-muted-foreground text-[10px] tabular-nums">
                          {d.fileName} · {formatExactAmount(BigInt(d.sizeBytes).toString())} بایت
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/v1/kyc/documents/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-600 dark:text-gold-400 shrink-0 text-[11px] font-medium hover:underline"
                    >
                      مشاهده
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground mt-3 text-[10px]">
              مدارک از endpoint امن و با لاگ ممیزی ارائه می‌شوند — لینک در برگه جدید باز می‌شود.
            </p>
          </section>
        </div>
      </div>

      {/* ===== Dialog تصمیم ===== */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(v) => {
          if (!v) setDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'approve'
                ? 'تایید احراز هویت'
                : dialog === 'reject'
                  ? 'رد احراز هویت'
                  : 'درخواست اصلاح'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'approve'
                ? 'سطح KYC کاربر ارتقا می‌یابد و اعلان نتیجه ارسال می‌شود. این عمل ممیزی می‌شود.'
                : 'اعلام دلیل الزامی است؛ برای کاربر اعلان ارسال می‌شود و عمل ممیزی می‌گردد.'}
            </DialogDescription>
          </DialogHeader>

          {dialog !== 'approve' && (
            <div>
              <label
                htmlFor="kyc-reason"
                className="text-foreground mb-1.5 block text-xs font-medium"
              >
                دلیل (حداقل ۵ نویسه — الزامی)
              </label>
              <textarea
                id="kyc-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                required
                aria-invalid={reason.length > 0 && reason.trim().length < 5}
                aria-describedby="kyc-reason-help"
                className="border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="دلیل برای کاربر و ممیزی…"
              />
              <p id="kyc-reason-help" className="text-muted-foreground mt-1 text-[10px]">
                حداقل ۵ نویسه؛ این متن در اعلان کاربر و لاگ ممیزی ثبت می‌شود.
              </p>
            </div>
          )}
          {dialog === 'approve' && (
            <div>
              <label
                htmlFor="kyc-reason"
                className="text-foreground mb-1.5 block text-xs font-medium"
              >
                یادداشت (اختیاری)
              </label>
              <textarea
                id="kyc-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                className="border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={submitReview}
              disabled={actionBusy || (dialog !== 'approve' && reason.trim().length < 5)}
              className="bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {actionBusy ? 'در حال ثبت…' : 'تایید و ثبت تصمیم'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  busy,
  icon,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  busy: boolean
  icon: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'error'
}) {
  const tones = {
    default: 'border-border/60 bg-card text-foreground hover:bg-muted',
    success: 'border-success/30 bg-success/10 text-success hover:bg-success/15',
    warning: 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15',
    error: 'border-error/30 bg-error/10 text-error hover:bg-error/15',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${tones[tone]}`}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
      {children}
    </button>
  )
}
