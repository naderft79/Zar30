// ============================================
// Zar30 - Admin User Detail (Client)
// ============================================
// بخش‌ها permission-scoped هستند — null یعنی ادمین آن permission را ندارد
// تغییر وضعیت فقط با users.status + Dialog تایید + دلیل اجباری
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Ban, CheckCircle2 } from 'lucide-react'
import { apiGetWithRefresh, apiPatch } from '@/lib/api/client'
import type { AdminUserDetail } from '@/lib/services/admin-user.service'
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-muted-foreground shrink-0 text-[11px]">{label}</dt>
      <dd className="text-foreground min-w-0 text-left text-xs">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-5">
      <h2 className="text-foreground mb-3 text-sm font-bold">{title}</h2>
      {children}
    </section>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AdminUserDetailClient() {
  const { id } = useParams<{ id: string }>()
  const { admin } = useAdmin()
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // base permission — محدودیت self/admin فقط بعد از load محاسبه می‌شود
  const canChangeStatusBase = hasPermission(admin.permissions, PERMISSIONS.USERS_STATUS)

  // setState فقط بعد از await — مطابق rule react-hooks/set-state-in-effect
  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ user: AdminUserDetail }>(`/api/v1/admin/users/${id}`)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'بارگذاری کاربر ناموفق بود')
      return
    }
    setError(null)
    setDetail(res.data!.user)
  }, [id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ user: AdminUserDetail }>(`/api/v1/admin/users/${id}`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری کاربر ناموفق بود')
        return
      }
      setError(null)
      setDetail(res.data!.user)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading && !detail) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری کاربر" className="space-y-4">
        <div className="skeleton-shimmer h-28 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton-shimmer h-64 rounded-xl" />
          <div className="skeleton-shimmer h-64 rounded-xl" />
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

  const u = detail.user
  const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.mobile
  // permission + منع self + ادمین فعال فقط برای SUPER_ADMIN (مطابق guard سرور)
  const canChangeStatus =
    canChangeStatusBase &&
    admin.userId !== u.id &&
    (!detail.adminRole?.active || admin.role === 'SUPER_ADMIN')

  return (
    <div>
      <AdminPageHeader
        title={displayName}
        eyebrow="مشتریان — کاربران"
        description={`شناسه: ${u.id}`}
        actions={
          canChangeStatus ? (
            <StatusActionDialog userId={u.id} currentStatus={u.status} onDone={load} />
          ) : undefined
        }
      />

      {/* ===== Identity strip ===== */}
      <div className="bg-card border-border/60 mb-6 flex flex-wrap items-center gap-4 rounded-xl border p-4">
        <span className="bg-navy-800 text-cream-100 flex size-11 items-center justify-center rounded-full text-sm font-bold">
          {displayName.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold tabular-nums" dir="ltr">
            {toPersianDigits(u.mobile)}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {u.email ?? 'ایمیل ثبت نشده'} · {KYC_LEVEL_LABELS[u.kycLevel] ?? u.kycLevel}
          </p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          {detail.adminRole && (
            <span className="border-gold-500/30 bg-gold-500/10 text-gold-600 dark:text-gold-400 rounded-md border px-2 py-0.5 text-[11px] font-medium">
              ادمین — {detail.adminRole.role}
              {detail.adminRole.active ? '' : ' (غیرفعال)'}
            </span>
          )}
          <AdminStatus status={u.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== نمای کلی حساب ===== */}
        <Section title="نمای کلی حساب">
          <dl className="divide-border/40 divide-y">
            <Field label="امتیاز اعتباری" value={toPersianDigits(u.creditScore)} />
            <Field label="کد معرف" value={<span dir="ltr">{u.referralCode}</span>} />
            <Field label="تایید موبایل" value={fmtDate(u.mobileVerifiedAt)} />
            <Field label="آخرین ورود" value={fmtDate(u.lastLoginAt)} />
            <Field label="ایجاد حساب" value={fmtDate(u.createdAt)} />
            <Field
              label="شمارش‌ها"
              value={`${toPersianDigits(detail.counts.orders)} سفارش · ${toPersianDigits(detail.counts.transactions)} تراکنش · ${toPersianDigits(detail.counts.tickets)} تیکت · ${toPersianDigits(detail.counts.sessions)} نشست`}
            />
          </dl>
        </Section>

        {/* ===== کیف پول — فقط با accounts/wallets.read ===== */}
        {detail.wallet && (
          <Section title="کیف پول و حساب‌های دارایی">
            <dl className="divide-border/40 divide-y">
              {detail.wallet.accounts.map((a) => (
                <Field
                  key={a.assetType}
                  label={
                    a.assetType === 'RIAL'
                      ? 'ریال'
                      : a.assetType === 'GOLD'
                        ? 'طلا (گرم)'
                        : a.assetType
                  }
                  value={
                    <span className="tabular-nums">
                      {formatExactAmount(a.balance)}
                      <span className="text-muted-foreground block text-[10px]">
                        مسدود: {formatExactAmount(a.lockedBalance)}
                      </span>
                    </span>
                  }
                />
              ))}
              {detail.wallet.accounts.length === 0 && (
                <p className="text-muted-foreground text-xs">حساب دارایی ندارد</p>
              )}
            </dl>
          </Section>
        )}

        {/* ===== KYC — فقط با kyc.read ===== */}
        {detail.kyc && (
          <Section title="سوابق احراز هویت">
            {detail.kyc.length === 0 ? (
              <p className="text-muted-foreground text-xs">پرونده‌ای ثبت نشده است</p>
            ) : (
              <ul className="space-y-2">
                {detail.kyc.map((s) => (
                  <li
                    key={s.id}
                    className="border-border/40 flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <AdminStatus status={s.status} />
                      <span className="text-muted-foreground mr-2 text-[11px]">
                        {KYC_LEVEL_LABELS[s.level] ?? s.level}
                      </span>
                    </div>
                    <Link
                      href={`/admin/kyc/${s.id}`}
                      className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                    >
                      {fmtDate(s.submittedAt ?? s.reviewedAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ===== تراکنش‌ها — فقط با transactions.read ===== */}
        {detail.transactions && (
          <Section title="تراکنش‌های اخیر">
            {detail.transactions.length === 0 ? (
              <p className="text-muted-foreground text-xs">تراکنشی ندارد</p>
            ) : (
              <ul className="space-y-2">
                {detail.transactions.map((t) => (
                  <li
                    key={t.id}
                    className="border-border/40 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs"
                  >
                    <div>
                      <span className="text-foreground font-medium">{t.type}</span>
                      <span className="text-muted-foreground mr-2 tabular-nums">
                        {formatExactAmount(t.amount)} ریال
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatus status={t.status} />
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {fmtDate(t.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ===== سفارش‌ها — فقط با orders.read ===== */}
        {detail.orders && (
          <Section title="سفارش‌های اخیر">
            {detail.orders.length === 0 ? (
              <p className="text-muted-foreground text-xs">سفارشی ندارد</p>
            ) : (
              <ul className="space-y-2">
                {detail.orders.map((o) => (
                  <li
                    key={o.id}
                    className="border-border/40 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs"
                  >
                    <div>
                      <span className="text-foreground font-medium">
                        {o.type === 'BUY' ? 'خرید' : 'فروش'} {formatExactAmount(o.goldAmount)} گرم
                      </span>
                      <span className="text-muted-foreground mr-2 tabular-nums">
                        {formatExactAmount(o.total)} ریال
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatus status={o.status} />
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {fmtDate(o.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ===== نشست‌ها — فقط با security.read ===== */}
        {detail.sessions && (
          <Section title="نشست‌های اخیر">
            {detail.sessions.length === 0 ? (
              <p className="text-muted-foreground text-xs">نشستی ندارد</p>
            ) : (
              <ul className="space-y-2">
                {detail.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="border-border/40 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate">
                        {s.deviceInfo ?? s.userAgent ?? '—'}
                      </p>
                      <p className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                        {s.ip ?? '—'}
                      </p>
                    </div>
                    <span
                      className={
                        s.revokedAt
                          ? 'text-muted-foreground text-[10px]'
                          : 'text-success text-[10px]'
                      }
                    >
                      {s.revokedAt ? 'لغوشده' : 'فعال'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* ===== ممیزی — فقط با audit.read ===== */}
        {detail.audit && (
          <Section title="رویدادهای ممیزی مرتبط">
            {detail.audit.length === 0 ? (
              <p className="text-muted-foreground text-xs">رویدادی ثبت نشده است</p>
            ) : (
              <ul className="space-y-2">
                {detail.audit.map((a) => (
                  <li key={a.id} className="border-border/40 rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-foreground font-medium" dir="ltr">
                        {a.action}
                      </span>
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {fmtDate(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {a.actorType}
                      {a.actorRole ? ` — ${a.actorRole}` : ''} · {a.entityType}
                      {a.reason ? ` — ${a.reason}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}
      </div>
    </div>
  )
}

// ---- Dialog تغییر وضعیت — تایید صریح + دلیل اجباری ----
function StatusActionDialog({
  userId,
  currentStatus,
  onDone,
}: {
  userId: string
  currentStatus: string
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED'>(
    currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED',
  )
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reasonValid = reason.trim().length >= 5

  async function submit() {
    if (!reasonValid || busy) return
    setBusy(true)
    setError(null)
    const res = await apiPatch(`/api/v1/admin/users/${userId}/status`, {
      status,
      reason: reason.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'تغییر وضعیت ناموفق بود')
      return
    }
    setDone(true)
    onDone()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // هر بازشدن: وضعیت پیش‌فرض = برعکس وضعیت فعلی + فرم پاک
          setStatus(currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')
          setReason('')
          setDone(false)
          setError(null)
          setOpen(true)
        }}
        className="border-border/60 bg-card text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {currentStatus === 'BLOCKED' ? (
          <CheckCircle2 className="size-4" strokeWidth={1.75} />
        ) : (
          <Ban className="size-4" strokeWidth={1.75} />
        )}
        تغییر وضعیت حساب
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر وضعیت حساب کاربر</DialogTitle>
            <DialogDescription>
              این عملیات ممیزی می‌شود و برای مسدودسازی همه نشست‌های کاربر لغو می‌گردد.
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <p className="text-success flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              وضعیت با موفقیت تغییر کرد.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="status-select"
                  className="text-foreground mb-1.5 block text-xs font-medium"
                >
                  وضعیت جدید
                </label>
                <select
                  id="status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'BLOCKED')}
                  className="border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="ACTIVE">فعال</option>
                  <option value="BLOCKED">مسدود</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="status-reason"
                  className="text-foreground mb-1.5 block text-xs font-medium"
                >
                  دلیل (حداقل ۵ نویسه — الزامی)
                </label>
                <textarea
                  id="status-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  required
                  aria-invalid={reason.length > 0 && !reasonValid}
                  aria-describedby="status-reason-help"
                  className="border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  placeholder="دلیل داخلی برای ثبت در ممیزی…"
                />
                <p id="status-reason-help" className="text-muted-foreground mt-1 text-[10px]">
                  حداقل ۵ نویسه؛ در لاگ ممیزی ثبت می‌شود.
                </p>
              </div>
              {error && (
                <p role="alert" className="text-error text-xs">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {!done && (
              <button
                type="button"
                onClick={submit}
                disabled={!reasonValid || busy}
                className="bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? 'در حال اعمال…' : 'تایید و اعمال'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
