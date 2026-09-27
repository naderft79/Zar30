// ============================================
// Zar30 - User Management Sections (All Subpages)
// ============================================
// هر section یک زیرصفحه اختصاصی — دکمه‌های جدول کاربران اینجا فرود می‌آیند
// read با permission متناظر؛ mutationها با audit سرور
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconBan,
  IconCircleCheck,
  IconRefresh,
  IconSend,
} from '@tabler/icons-react'
import { apiGetWithRefresh, apiPatch, apiPost, apiPut } from '@/lib/api/client'
import { AdminStatus } from '@/components/admin/admin-status'
import { UserSubpage } from '@/components/admin/user-subpage'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import {
  formatExactAmount,
  formatGoldAmount,
  formatGoldGrams,
  toPersianDigits,
} from '@/lib/utils/format'
import { cn } from 'cn'

// ---------- ابزار مشترک ----------
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-foreground text-sm font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground border-border/60 rounded-xl border border-dashed p-6 text-center text-xs">
      {text}
    </p>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <p
      role="alert"
      className="border-error/30 bg-error/5 text-error flex items-center gap-2 rounded-xl border p-3 text-xs"
    >
      <IconAlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      {msg}
    </p>
  )
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <p
      role="status"
      className="border-success/30 bg-success/5 text-success flex items-center gap-2 rounded-xl border p-3 text-xs"
    >
      <IconCircleCheck className="size-4 shrink-0" aria-hidden="true" />
      {msg}
    </p>
  )
}

const inputCls =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'
const labelCls = 'text-muted-foreground mb-1 block text-[11px] font-medium'
const btnPrimary =
  'bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg px-5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'

// اعلان‌های deny — کاربر permission ندارد
function Denied({ what }: { what: string }) {
  return <ErrorBox msg={`دسترسی لازم برای ${what} را ندارید — با مدیر ارشد هماهنگ کنید.`} />
}

// ============================================================
// ۱) ویرایش مشخصات
// ============================================================
interface ProfileDto {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  email: string | null
  status: string
  kycLevel: string
  creditScore: number
  referralCode: string
  referredBy: { id: string; mobile: string; name: string } | null
  referralsCount: number
  mobileVerifiedAt: string | null
  lastLoginAt: string | null
  lockedUntil: string | null
  failedLoginAttempts: number
  createdAt: string
}

export function UserProfileEditSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canEdit = hasPermission(admin.permissions, PERMISSIONS.USERS_UPDATE)
  const [profile, setProfile] = useState<ProfileDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ profile: ProfileDto }>(
        `/api/v1/admin/users/${id}/profile`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      const p = res.data!.profile
      setProfile(p)
      setFirstName(p.firstName ?? '')
      setLastName(p.lastName ?? '')
      setEmail(p.email ?? '')
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPatch(`/api/v1/admin/users/${id}/profile`, {
      firstName,
      lastName,
      email,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ذخیره ناموفق بود')
      return
    }
    setDone('مشخصات با موفقیت به‌روزرسانی شد.')
  }

  return (
    <UserSubpage path="edit">
      <Section title="ویرایش مشخصات کاربر">
        {!canEdit ? (
          <Denied what="ویرایش مشخصات" />
        ) : !profile ? (
          <div className="skeleton-shimmer h-40 rounded-xl" />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
            className="max-w-md space-y-4"
          >
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="uf-first" className={labelCls}>
                  نام
                </label>
                <input
                  id="uf-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="uf-last" className={labelCls}>
                  نام خانوادگی
                </label>
                <input
                  id="uf-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="uf-email" className={labelCls}>
                ایمیل
              </label>
              <input
                id="uf-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <dl className="border-border/40 divide-border/40 divide-y rounded-xl border">
              {[
                { k: 'موبایل', v: toPersianDigits(profile.mobile) },
                {
                  k: 'وضعیت',
                  v:
                    profile.status === 'ACTIVE'
                      ? 'فعال'
                      : profile.status === 'BLOCKED'
                        ? 'مسدود'
                        : 'حذف‌شده',
                },
                { k: 'سطح KYC', v: toPersianDigits(profile.kycLevel.replace('LEVEL_', '')) },
                { k: 'امتیاز اعتباری', v: toPersianDigits(profile.creditScore) },
                { k: 'کد معرف', v: profile.referralCode },
                {
                  k: 'معرف',
                  v: profile.referredBy
                    ? `${profile.referredBy.name} (${toPersianDigits(profile.referredBy.mobile)})`
                    : '—',
                },
                { k: 'دعوت‌شده توسط او', v: `${toPersianDigits(profile.referralsCount)} نفر` },
                { k: 'تایید موبایل', v: fmtDate(profile.mobileVerifiedAt) },
                { k: 'آخرین ورود', v: fmtDate(profile.lastLoginAt) },
                { k: 'ورودهای ناموفق', v: toPersianDigits(profile.failedLoginAttempts) },
                { k: 'ایجاد حساب', v: fmtDate(profile.createdAt) },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between px-3 py-2 text-xs">
                  <dt className="text-muted-foreground">{f.k}</dt>
                  <dd className="text-foreground font-medium">{f.v}</dd>
                </div>
              ))}
            </dl>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
            </button>
          </form>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۲) کارت و شبا
// ============================================================
interface BankRow {
  id: string
  bankName: string
  ibanMasked: string
  cardPanMasked: string | null
  isDefault: boolean
  blocked: boolean
  blockNote: string | null
  createdAt: string
}

export function UserBankAccountsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.BANK_ACCOUNTS_READ)
  const [rows, setRows] = useState<BankRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ accounts: BankRow[] }>(
        `/api/v1/admin/users/${id}/bank-accounts`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.accounts)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="bank-accounts">
      <Section title="کارت‌ها و حساب‌های بانکی کاربر">
        {!canSee ? (
          <Denied what="مشاهده حساب‌های بانکی" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="حساب بانکی ثبت نشده است" />
        ) : (
          <ul className="space-y-2">
            {rows.map((b) => (
              <li
                key={b.id}
                className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
              >
                <div>
                  <p className="text-foreground font-semibold">
                    {b.bankName}
                    {b.isDefault && <span className="text-success mr-2 text-[10px]">پیش‌فرض</span>}
                    {b.blocked && <span className="text-error mr-2 text-[10px]">مسدود</span>}
                  </p>
                  <p className="text-muted-foreground mt-0.5 tabular-nums" dir="ltr">
                    {b.ibanMasked}
                  </p>
                  {b.cardPanMasked && (
                    <p className="text-muted-foreground mt-0.5 tabular-nums" dir="ltr">
                      {b.cardPanMasked}
                    </p>
                  )}
                  {b.blockNote && <p className="text-error mt-0.5 text-[10px]">{b.blockNote}</p>}
                </div>
                <span className="text-muted-foreground text-[10px]">{fmtDate(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۳) احراز هویت
// ============================================================
interface KycRow {
  id: string
  level: string
  status: string
  currentStep: number
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
}

export function UserKycSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.KYC_READ)
  const [rows, setRows] = useState<KycRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ submissions: KycRow[] }>(
        `/api/v1/admin/users/${id}/kyc`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.submissions)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="kyc">
      <Section
        title="سوابق احراز هویت"
        action={
          <Link
            href="/admin/kyc"
            className="text-muted-foreground hover:text-foreground text-[11px]"
          >
            صف بررسی KYC ←
          </Link>
        }
      >
        {!canSee ? (
          <Denied what="مشاهده پرونده احراز هویت" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="پرونده‌ای ثبت نشده است" />
        ) : (
          <ul className="space-y-2">
            {rows.map((s) => (
              <li
                key={s.id}
                className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AdminStatus status={s.status} />
                  <span className="text-foreground">
                    سطح {toPersianDigits(s.level.replace('LEVEL_', ''))}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    مرحله {toPersianDigits(s.currentStep)}
                  </span>
                </div>
                <div className="text-end">
                  <p className="text-muted-foreground text-[10px]">
                    ارسال: {fmtDate(s.submittedAt)}
                  </p>
                  {s.reviewedAt && (
                    <p className="text-muted-foreground text-[10px]">
                      بررسی: {fmtDate(s.reviewedAt)}
                    </p>
                  )}
                </div>
                {s.rejectionReason && (
                  <p className="text-error w-full text-[10px]">دلیل رد: {s.rejectionReason}</p>
                )}
                <Link
                  href={`/admin/kyc/${s.id}`}
                  className="text-gold-600 dark:text-gold-400 text-[11px] hover:underline"
                >
                  بررسی پرونده
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۴) سفارشات
// ============================================================
interface OrderRow {
  id: string
  type: string
  goldAmount: string
  tomanAmount: string
  unitPrice: string
  fee: string
  total: string
  status: string
  createdAt: string
}

export function UserOrdersSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.ORDERS_READ)
  const [rows, setRows] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ orders: OrderRow[] }>(
        `/api/v1/admin/users/${id}/orders`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.orders)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="orders">
      <Section title="سفارش‌های خرید و فروش">
        {!canSee ? (
          <Denied what="مشاهده سفارشات" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="سفارشی ثبت نشده است" />
        ) : (
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">نوع</th>
                  <th className="px-3 py-2 text-start font-medium">مقدار</th>
                  <th className="px-3 py-2 text-start font-medium">مبلغ کل</th>
                  <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td
                      className={cn(
                        'px-3 py-2 font-bold',
                        o.type === 'BUY' ? 'text-success' : 'text-error',
                      )}
                    >
                      {o.type === 'BUY' ? 'خرید' : 'فروش'}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatGoldGrams(o.goldAmount)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatExactAmount(o.total)} تومان</td>
                    <td className="px-3 py-2">
                      <AdminStatus status={o.status} />
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {fmtDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۵) همگام‌سازی سفارشات
// ============================================================
interface SyncResult {
  accounts: { assetType: string; before: string; after: string; changed: boolean }[]
}

export function UserSyncSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSync = hasPermission(admin.permissions, PERMISSIONS.WALLETS_FREEZE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function run() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPost<SyncResult>(`/api/v1/admin/users/${id}/sync`, {})
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'همگام‌سازی ناموفق بود')
      return
    }
    setResult(res.data ?? null)
    setDone('موجودی‌ها با دفتر کل مقایسه و همگام شد.')
  }

  return (
    <UserSubpage path="sync">
      <Section
        title="همگام‌سازی سفارشات و موجودی"
        action={
          canSync && (
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className="border-gold-500/50 text-gold-700 dark:text-gold-400 hover:bg-gold-500/10 inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:opacity-50"
            >
              <IconRefresh className={cn('size-3.5', busy && 'animate-spin')} />
              {busy ? 'در حال اجرا…' : 'اجرا'}
            </button>
          )
        }
      >
        {!canSync ? (
          <Denied what="همگام‌سازی موجودی" />
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs leading-6">
              موجودی فعلی هر حساب دارایی با مجموع اقلام دفتر کل (ledger) مقایسه می‌شود؛ در صورت
              مغایرت، موجودی از دفتر بازمحاسبه و به‌روزرسانی می‌شود. این عملیات در لاگ ممیزی ثبت
              می‌شود.
            </p>
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            {result && (
              <div className="border-border/60 overflow-hidden rounded-xl border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="px-3 py-2 text-start font-medium">حساب</th>
                      <th className="px-3 py-2 text-start font-medium">موجودی قبلی</th>
                      <th className="px-3 py-2 text-start font-medium">موجودی جدید</th>
                      <th className="px-3 py-2 text-start font-medium">تغییر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/40 divide-y">
                    {result.accounts.map((a) => (
                      <tr key={a.assetType}>
                        <td className="px-3 py-2 font-medium">
                          {a.assetType === 'GOLD' ? 'طلا (گرم)' : 'تومان'}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {a.assetType === 'GOLD'
                            ? formatGoldAmount(a.before)
                            : formatExactAmount(a.before)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {a.assetType === 'GOLD'
                            ? formatGoldAmount(a.after)
                            : formatExactAmount(a.after)}
                        </td>
                        <td className="px-3 py-2">
                          {a.changed ? (
                            <span className="text-warning font-bold">مغایرت — اصلاح شد</span>
                          ) : (
                            <span className="text-success">یکسان</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۶) تراکنش‌های مالی
// ============================================================
interface TxRow {
  id: string
  type: string
  amount: string
  status: string
  gatewayRef: string | null
  bankRef: string | null
  createdAt: string
}

export function UserTransactionsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.TRANSACTIONS_READ)
  const [rows, setRows] = useState<TxRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ transactions: TxRow[] }>(
        `/api/v1/admin/users/${id}/transactions`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.transactions)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const TYPE_LABELS: Record<string, string> = {
    DEPOSIT: 'واریز',
    WITHDRAW: 'برداشت',
    FEE: 'کارمزد',
    TRANSFER: 'انتقال',
  }

  return (
    <UserSubpage path="transactions">
      <Section title="تراکنش‌های مالی">
        {!canSee ? (
          <Denied what="مشاهده تراکنش‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="تراکنشی ثبت نشده است" />
        ) : (
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">نوع</th>
                  <th className="px-3 py-2 text-start font-medium">مبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2 text-start font-medium">مرجع درگاه</th>
                  <th className="px-3 py-2 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-medium">{TYPE_LABELS[t.type] ?? t.type}</td>
                    <td className="px-3 py-2 tabular-nums">{formatExactAmount(t.amount)} تومان</td>
                    <td className="px-3 py-2">
                      <AdminStatus status={t.status} />
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-[10px]" dir="ltr">
                      {t.gatewayRef ?? t.bankRef ?? '—'}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۷) کیف پول طلایی و تومانی
// ============================================================
interface WalletDto {
  id: string
  status: string
  createdAt: string
  accounts: { assetType: string; balance: string; lockedBalance: string }[]
}

export function UserWalletSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.WALLETS_READ)
  const [wallet, setWallet] = useState<WalletDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ wallet: WalletDto | null }>(
        `/api/v1/admin/users/${id}/wallet`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setWallet(res.data!.wallet)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="wallet">
      {!canSee ? (
        <Denied what="مشاهده کیف پول" />
      ) : error ? (
        <ErrorBox msg={error} />
      ) : !wallet ? (
        <Empty text="کیف پول هنوز ساخته نشده است" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {wallet.accounts.map((a) => (
            <Section
              key={a.assetType}
              title={
                a.assetType === 'GOLD'
                  ? 'کیف پول طلایی'
                  : a.assetType === 'TOMAN'
                    ? 'کیف پول تومانی'
                    : a.assetType
              }
            >
              <div className="space-y-3">
                <div className="border-gold-500/30 from-gold-500/10 rounded-xl border bg-gradient-to-bl to-transparent p-4">
                  <p className="text-muted-foreground text-[11px]">موجودی آزاد</p>
                  <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                    {a.assetType === 'GOLD'
                      ? formatGoldGrams(a.balance)
                      : `${formatExactAmount(a.balance)} تومان`}
                  </p>
                  <p className="text-warning mt-1 text-[11px]">
                    مسدودشده:{' '}
                    {a.assetType === 'GOLD'
                      ? formatGoldGrams(a.lockedBalance)
                      : `${formatExactAmount(a.lockedBalance)} تومان`}
                  </p>
                </div>
                <p className="text-muted-foreground text-[10px]">
                  وضعیت کیف: {wallet.status === 'active' ? 'فعال' : 'مسدود'} · ساخت:{' '}
                  {fmtDate(wallet.createdAt)}
                </p>
              </div>
            </Section>
          ))}
          {wallet.accounts.length === 0 && <Empty text="حساب دارایی ثبت نشده است" />}
        </div>
      )}
    </UserSubpage>
  )
}

// ============================================================
// ۸) انتقال‌ها
// ============================================================
interface TransferRow {
  id: string
  direction: 'in' | 'out'
  assetType: string
  tomanAmount: string | null
  goldAmount: string | null
  kind: string
  status: string
  flagged: boolean
  createdAt: string
}

export function UserTransfersSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.TRANSFERS_READ)
  const [rows, setRows] = useState<TransferRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ transfers: TransferRow[] }>(
        `/api/v1/admin/users/${id}/transfers`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.transfers)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="transfers">
      <Section title="انتقال‌های داخلی (ورودی/خروجی)">
        {!canSee ? (
          <Denied what="مشاهده انتقال‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="انتقالی ثبت نشده است" />
        ) : (
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">جهت</th>
                  <th className="px-3 py-2 text-start font-medium">دارایی</th>
                  <th className="px-3 py-2 text-start font-medium">مقدار</th>
                  <th className="px-3 py-2 text-start font-medium">نوع</th>
                  <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td
                      className={cn(
                        'px-3 py-2 font-bold',
                        t.direction === 'out' ? 'text-error' : 'text-success',
                      )}
                    >
                      {t.direction === 'out' ? 'خروجی' : 'ورودی'}
                    </td>
                    <td className="px-3 py-2">{t.assetType === 'GOLD' ? 'طلا' : 'تومان'}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {t.assetType === 'GOLD'
                        ? formatGoldAmount(t.goldAmount ?? '0')
                        : formatExactAmount(t.tomanAmount ?? '0')}
                    </td>
                    <td className="px-3 py-2">{t.kind === 'GIFT' ? 'هدیه' : 'انتقال'}</td>
                    <td className="px-3 py-2">
                      <AdminStatus status={t.status} />
                      {t.flagged && <span className="text-error mr-1 text-[10px]">پرچم‌دار</span>}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۹) تراکنش‌های درگاه
// ============================================================
interface PaymentRow {
  id: string
  gateway: string
  amount: string
  status: string
  refId: string | null
  cardPanMasked: string | null
  failureReason: string | null
  verifiedAt: string | null
  createdAt: string
}

export function UserPaymentsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.PAYMENTS_READ)
  const [rows, setRows] = useState<PaymentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ payments: PaymentRow[] }>(
        `/api/v1/admin/users/${id}/payments`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.payments)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="payments">
      <Section title="تراکنش‌های درگاه پرداخت">
        {!canSee ? (
          <Denied what="مشاهده پرداخت‌های درگاه" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="پرداختی ثبت نشده است" />
        ) : (
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">درگاه</th>
                  <th className="px-3 py-2 text-start font-medium">مبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2 text-start font-medium">کارت</th>
                  <th className="px-3 py-2 text-start font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium" dir="ltr">
                      {p.gateway}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatExactAmount(p.amount)} تومان</td>
                    <td className="px-3 py-2">
                      <AdminStatus status={p.status} />
                      {p.failureReason && (
                        <p className="text-error mt-0.5 text-[10px]">{p.failureReason}</p>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums" dir="ltr">
                      {p.cardPanMasked ?? '—'}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {fmtDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۰) تحویل فیزیکی
// ============================================================
interface DeliveryRow {
  id: string
  grams: string
  method: string
  status: string
  trackingCode: string | null
  reviewNote: string | null
  createdAt: string
}

export function UserDeliveriesSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.DELIVERY_READ)
  const [rows, setRows] = useState<DeliveryRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ deliveries: DeliveryRow[] }>(
        `/api/v1/admin/users/${id}/deliveries`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.deliveries)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="deliveries">
      <Section title="درخواست‌های تحویل فیزیکی">
        {!canSee ? (
          <Denied what="مشاهده تحویل‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="درخواست تحویلی ثبت نشده است" />
        ) : (
          <ul className="space-y-2">
            {rows.map((d) => (
              <li
                key={d.id}
                className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AdminStatus status={d.status} />
                  <span className="text-foreground font-medium">
                    {formatGoldAmount(d.grams)} گرم
                  </span>
                  <span className="text-muted-foreground">
                    {d.method === 'POST' ? 'پست' : 'حضوری'}
                  </span>
                </div>
                {d.trackingCode && (
                  <span className="text-muted-foreground tabular-nums" dir="ltr">
                    رهگیری: {d.trackingCode}
                  </span>
                )}
                <span className="text-muted-foreground text-[10px]">{fmtDate(d.createdAt)}</span>
                <Link
                  href={`/admin/delivery/${d.id}`}
                  className="text-gold-600 dark:text-gold-400 text-[11px] hover:underline"
                >
                  جزئیات
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۱) قسطی
// ============================================================
interface InstallmentRow {
  id: string
  principal: string
  downPayment: string
  totalPayable: string
  status: string
  method: string
  paymentsTotal: number
  paymentsPaid: number
  createdAt: string
}

export function UserInstallmentsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.INSTALLMENTS_READ)
  const [rows, setRows] = useState<InstallmentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ contracts: InstallmentRow[] }>(
        `/api/v1/admin/users/${id}/installments`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.contracts)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="installments">
      <Section
        title="قراردادهای خرید قسطی"
        action={
          <Link
            href="/admin/installments"
            className="text-muted-foreground hover:text-foreground text-[11px]"
          >
            مدیریت قسطی ←
          </Link>
        }
      >
        {!canSee ? (
          <Denied what="مشاهده قراردادهای قسطی" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="قرارداد قسطی ثبت نشده است" />
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="border-border/40 rounded-lg border p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AdminStatus status={c.status} />
                    <span className="text-muted-foreground">
                      {c.method === 'CHEQUE' ? 'چک' : 'اعتبارسنجی داخلی'}
                    </span>
                  </div>
                  <Link
                    href={`/admin/installments/${c.id}`}
                    className="text-gold-600 dark:text-gold-400 text-[11px] hover:underline"
                  >
                    جزئیات قرارداد
                  </Link>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-muted-foreground text-[10px]">اصل مبلغ</p>
                    <p className="font-bold tabular-nums">{formatExactAmount(c.principal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">پیش‌پرداخت</p>
                    <p className="font-bold tabular-nums">{formatExactAmount(c.downPayment)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">اقساط</p>
                    <p className="font-bold tabular-nums">
                      {toPersianDigits(c.paymentsPaid)}/{toPersianDigits(c.paymentsTotal)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۲) زرکار (سرمایه‌گذاری)
// ============================================================
interface InvestmentRow {
  id: string
  planName: string
  rate: string
  goldAmount: string
  paidOut: string
  status: string
  startDate: string
  endDate: string
}

export function UserInvestmentsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.INVESTMENTS_READ)
  const [rows, setRows] = useState<InvestmentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ positions: InvestmentRow[] }>(
        `/api/v1/admin/users/${id}/investments`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.positions)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="investments">
      <Section title="سپرده‌های زرکار (سرمایه‌گذاری)">
        {!canSee ? (
          <Denied what="مشاهده سرمایه‌گذاری‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="موقعیت سرمایه‌گذاری ثبت نشده است" />
        ) : (
          <div className="border-border/60 overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">طرح</th>
                  <th className="px-3 py-2 text-start font-medium">سپرده</th>
                  <th className="px-3 py-2 text-start font-medium">سود پرداختی</th>
                  <th className="px-3 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2 text-start font-medium">سررسید</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium">{p.planName}</td>
                    <td className="px-3 py-2 tabular-nums">{formatGoldGrams(p.goldAmount)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatGoldGrams(p.paidOut)}</td>
                    <td className="px-3 py-2">
                      <AdminStatus status={p.status} />
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {fmtDate(p.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۳) دعوت دوستان
// ============================================================
interface ReferralRow {
  id: string
  status: string
  rewardAmount: string | null
  rewardType: string | null
  qualifiedAt: string | null
  createdAt: string
  referred: { id: string; mobile: string; name: string }
}

export function UserReferralsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.REFERRALS_READ)
  const [rows, setRows] = useState<ReferralRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ referrals: ReferralRow[] }>(
        `/api/v1/admin/users/${id}/referrals`,
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setRows(res.data!.referrals)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <UserSubpage path="referrals">
      <Section title="دعوت دوستان">
        {!canSee ? (
          <Denied what="مشاهده دعوت‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="دعوتی ثبت نشده است" />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AdminStatus status={r.status} />
                  <Link
                    href={`/admin/users/${r.referred.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {r.referred.name}
                  </Link>
                  <span className="text-muted-foreground tabular-nums" dir="ltr">
                    {toPersianDigits(r.referred.mobile)}
                  </span>
                </div>
                {r.rewardAmount && (
                  <span className="text-success text-[11px]">
                    پاداش: {formatExactAmount(r.rewardAmount)}{' '}
                    {r.rewardType === 'GOLD' ? 'گرم' : 'تومان'}
                  </span>
                )}
                <span className="text-muted-foreground text-[10px]">{fmtDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۴) کارمزد
// ============================================================
export function UserFeesSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.PRICING_READ)
  const canEdit = hasPermission(admin.permissions, PERMISSIONS.PRICING_UPDATE)
  const [buyFee, setBuyFee] = useState('')
  const [sellFee, setSellFee] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // setState فقط بعد از await — مطابق rule react-hooks/set-state-in-effect
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{
        override: {
          buyFeeBps: number | null
          sellFeeBps: number | null
          note: string | null
        } | null
      }>(`/api/v1/admin/users/${id}/fees`)
      if (cancelled) return
      if (res.ok && res.data) {
        const o = res.data.override
        setBuyFee(o?.buyFeeBps != null ? String(o.buyFeeBps / 100) : '')
        setSellFee(o?.sellFeeBps != null ? String(o.sellFeeBps / 100) : '')
        setNote(o?.note ?? '')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPut(`/api/v1/admin/users/${id}/fees`, {
      userId: id,
      buyFeeBps: buyFee ? Math.round(Number(buyFee) * 100) : null,
      sellFeeBps: sellFee ? Math.round(Number(sellFee) * 100) : null,
      note: note || null,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ذخیره ناموفق بود')
      return
    }
    setDone('کارمزد اختصاصی ذخیره شد — از معامله بعدی اعمال می‌شود.')
  }

  return (
    <UserSubpage path="fees">
      <Section title="کارمزد اختصاصی کاربر">
        {!canSee ? (
          <Denied what="مشاهده کارمزد" />
        ) : (
          <div className="max-w-md space-y-4">
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <p className="text-muted-foreground text-[11px] leading-5">
              مقادیر خالی یعنی استفاده از کارمزد گروهی (قاعده سطح/حجم). واحد: درصد — مثلاً ۰٫۲
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fee-buy" className={labelCls}>
                  کارمزد خرید (٪)
                </label>
                <input
                  id="fee-buy"
                  inputMode="decimal"
                  dir="ltr"
                  value={buyFee}
                  onChange={(e) => setBuyFee(e.target.value)}
                  disabled={!canEdit}
                  className={cn(inputCls, 'tabular-nums')}
                />
              </div>
              <div>
                <label htmlFor="fee-sell" className={labelCls}>
                  کارمزد فروش (٪)
                </label>
                <input
                  id="fee-sell"
                  inputMode="decimal"
                  dir="ltr"
                  value={sellFee}
                  onChange={(e) => setSellFee(e.target.value)}
                  disabled={!canEdit}
                  className={cn(inputCls, 'tabular-nums')}
                />
              </div>
            </div>
            <div>
              <label htmlFor="fee-note" className={labelCls}>
                یادداشت
              </label>
              <input
                id="fee-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!canEdit}
                className={inputCls}
                placeholder="دلیل استثنا…"
              />
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className={btnPrimary}
              >
                {busy ? 'در حال ذخیره…' : 'ذخیره کارمزد'}
              </button>
            )}
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۵) تغییر سطح
// ============================================================
export function UserLevelSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canChange = hasPermission(admin.permissions, PERMISSIONS.KYC_APPROVE)
  const [current, setCurrent] = useState<string | null>(null)
  const [level, setLevel] = useState('LEVEL_0')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ profile: { kycLevel: string } }>(
        `/api/v1/admin/users/${id}/profile`,
      )
      if (!cancelled && res.ok && res.data) setCurrent(res.data.profile.kycLevel)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (busy || reason.trim().length < 5) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPatch(`/api/v1/admin/users/${id}/level`, {
      kycLevel: level,
      reason: reason.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'تغییر سطح ناموفق بود')
      return
    }
    setCurrent(level)
    setDone('سطح احراز هویت تغییر کرد.')
  }

  return (
    <UserSubpage path="level">
      <Section title="تغییر سطح احراز هویت">
        {!canChange ? (
          <Denied what="تغییر سطح" />
        ) : (
          <div className="max-w-md space-y-4">
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <p className="text-muted-foreground text-xs">
              سطح فعلی: {current ? `سطح ${toPersianDigits(current.replace('LEVEL_', ''))}` : '…'}
            </p>
            <div>
              <label htmlFor="level-select" className={labelCls}>
                سطح جدید
              </label>
              <select
                id="level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputCls}
              >
                <option value="LEVEL_0">سطح ۰ — ثبت‌نام</option>
                <option value="LEVEL_1">سطح ۱ — موبایل تاییدشده</option>
                <option value="LEVEL_2">سطح ۲ — احراز هویت</option>
                <option value="LEVEL_3">سطح ۳ — کامل</option>
              </select>
            </div>
            <div>
              <label htmlFor="level-reason" className={labelCls}>
                دلیل (الزامی — ثبت در ممیزی)
              </label>
              <textarea
                id="level-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={cn(inputCls, 'h-auto py-2')}
              />
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || reason.trim().length < 5}
              className={btnPrimary}
            >
              {busy ? 'در حال اعمال…' : 'اعمال سطح جدید'}
            </button>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۶) ارسال پیامک
// ============================================================
export function UserMessageSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSend = hasPermission(admin.permissions, PERMISSIONS.NOTIFICATIONS_SEND)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState<'SMS' | 'IN_APP' | 'PUSH'>('SMS')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function send() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPost(`/api/v1/admin/users/${id}/message`, { title, body, channel })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ارسال ناموفق بود')
      return
    }
    setDone('پیام با موفقیت ثبت و ارسال شد.')
    setTitle('')
    setBody('')
  }

  return (
    <UserSubpage path="message">
      <Section title="ارسال پیامک / اعلان به کاربر">
        {!canSend ? (
          <Denied what="ارسال پیام" />
        ) : (
          <div className="max-w-md space-y-4">
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <div>
              <label htmlFor="msg-title" className={labelCls}>
                عنوان
              </label>
              <input
                id="msg-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="msg-body" className={labelCls}>
                متن پیام
              </label>
              <textarea
                id="msg-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className={cn(inputCls, 'h-auto py-2')}
              />
            </div>
            <div>
              <label htmlFor="msg-channel" className={labelCls}>
                کانال
              </label>
              <select
                id="msg-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
                className={inputCls}
              >
                <option value="SMS">پیامک</option>
                <option value="IN_APP">درون‌برنامه</option>
                <option value="PUSH">Push</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || title.trim().length < 2 || body.trim().length < 2}
              className={btnPrimary}
            >
              <IconSend className="size-4" />
              {busy ? 'در حال ارسال…' : 'ارسال'}
            </button>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۷) مشکوک (ریسک)
// ============================================================
interface RiskEventRow {
  id: string
  metric: string
  score: number
  detail: unknown
  reviewed: boolean
  reviewNote: string | null
  createdAt: string
}

export function UserRiskSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.RISK_READ)
  const canReview = hasPermission(admin.permissions, PERMISSIONS.RISK_REVIEW)
  const [rows, setRows] = useState<RiskEventRow[] | null>(null)
  const [metric, setMetric] = useState('')
  const [score, setScore] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ events: RiskEventRow[] }>(
      `/api/v1/admin/users/${id}/risk`,
    )
    if (res.ok && res.data) setRows(res.data.events)
  }, [id])

  // setState فقط بعد از await — مطابق rule react-hooks/set-state-in-effect
  useEffect(() => {
    if (!canSee) return
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ events: RiskEventRow[] }>(
        `/api/v1/admin/users/${id}/risk`,
      )
      if (cancelled) return
      if (res.ok && res.data) setRows(res.data.events)
    })()
    return () => {
      cancelled = true
    }
  }, [canSee, id])

  async function addSignal() {
    if (busy || metric.trim().length < 3) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPost(`/api/v1/admin/users/${id}/risk`, {
      metric: metric.trim(),
      score: Number(score) || 0,
      note: note || undefined,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت سیگنال ناموفق بود')
      return
    }
    setDone('سیگنال ریسک ثبت شد.')
    setMetric('')
    setScore('')
    setNote('')
    await load()
  }

  return (
    <UserSubpage path="risk">
      <Section title="رویدادهای ریسک و سیگنال‌های مشکوک">
        {!canSee ? (
          <Denied what="مشاهده ریسک" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : (
          <div className="space-y-4">
            {done && <SuccessBox msg={done} />}
            {!rows ? (
              <div className="skeleton-shimmer h-32 rounded-xl" />
            ) : rows.length === 0 ? (
              <Empty text="رویداد ریسکی ثبت نشده است" />
            ) : (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                          r.score >= 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
                        )}
                      >
                        {toPersianDigits(r.score > 0 ? `+${r.score}` : String(r.score))}
                      </span>
                      <span className="text-foreground font-medium" dir="ltr">
                        {r.metric}
                      </span>
                      {r.reviewed && <span className="text-success text-[10px]">بررسی‌شده</span>}
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      {fmtDate(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {canReview && (
              <div className="border-border/60 space-y-3 rounded-xl border p-4">
                <p className="text-foreground text-xs font-bold">افزودن سیگنال دستی</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="risk-metric" className={labelCls}>
                      متریک (انگلیسی)
                    </label>
                    <input
                      id="risk-metric"
                      dir="ltr"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      className={cn(inputCls, 'tabular-nums')}
                      placeholder="MANUAL_FLAG"
                    />
                  </div>
                  <div>
                    <label htmlFor="risk-score" className={labelCls}>
                      امتیاز (±)
                    </label>
                    <input
                      id="risk-score"
                      inputMode="numeric"
                      dir="ltr"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className={cn(inputCls, 'tabular-nums')}
                    />
                  </div>
                  <div>
                    <label htmlFor="risk-note" className={labelCls}>
                      یادداشت
                    </label>
                    <input
                      id="risk-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void addSignal()}
                  disabled={busy || metric.trim().length < 3}
                  className={btnPrimary}
                >
                  {busy ? 'در حال ثبت…' : 'ثبت سیگنال'}
                </button>
              </div>
            )}
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۸) اعتبارها
// ============================================================
export function UserCreditSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSet = hasPermission(admin.permissions, PERMISSIONS.RISK_REVIEW)
  const [current, setCurrent] = useState<number | null>(null)
  const [score, setScore] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ profile: { creditScore: number } }>(
        `/api/v1/admin/users/${id}/profile`,
      )
      if (!cancelled && res.ok && res.data) {
        setCurrent(res.data.profile.creditScore)
        setScore(String(res.data.profile.creditScore))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (busy || reason.trim().length < 5) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPatch(`/api/v1/admin/users/${id}/credit`, {
      creditScore: Number(score),
      reason: reason.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت امتیاز ناموفق بود')
      return
    }
    setCurrent(Number(score))
    setDone('امتیاز اعتباری به‌روزرسانی شد.')
  }

  return (
    <UserSubpage path="credit">
      <Section title="امتیاز اعتباری کاربر">
        {!canSet ? (
          <Denied what="تنظیم امتیاز اعتباری" />
        ) : (
          <div className="max-w-md space-y-4">
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <p className="text-muted-foreground text-xs">
              امتیاز فعلی: {current != null ? toPersianDigits(current) : '…'}
            </p>
            <div>
              <label htmlFor="credit-score" className={labelCls}>
                امتیاز جدید (۰ تا ۱۰۰۰)
              </label>
              <input
                id="credit-score"
                inputMode="numeric"
                dir="ltr"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className={cn(inputCls, 'tabular-nums')}
              />
            </div>
            <div>
              <label htmlFor="credit-reason" className={labelCls}>
                دلیل (الزامی)
              </label>
              <textarea
                id="credit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={cn(inputCls, 'h-auto py-2')}
              />
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || reason.trim().length < 5}
              className={btnPrimary}
            >
              {busy ? 'در حال ذخیره…' : 'ذخیره امتیاز'}
            </button>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۱۹) نشست‌ها
// ============================================================
interface SessionRow {
  id: string
  deviceInfo: string | null
  ip: string | null
  userAgent: string | null
  active: boolean
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

export function UserSessionsSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canSee = hasPermission(admin.permissions, PERMISSIONS.SECURITY_READ)
  const canManage = hasPermission(admin.permissions, PERMISSIONS.SECURITY_MANAGE)
  const [rows, setRows] = useState<SessionRow[] | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ sessions: SessionRow[] }>(
      `/api/v1/admin/users/${id}/sessions`,
    )
    if (res.ok && res.data) setRows(res.data.sessions)
  }, [id])

  // setState فقط بعد از await — مطابق rule react-hooks/set-state-in-effect
  useEffect(() => {
    if (!canSee) return
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ sessions: SessionRow[] }>(
        `/api/v1/admin/users/${id}/sessions`,
      )
      if (cancelled) return
      if (res.ok && res.data) setRows(res.data.sessions)
    })()
    return () => {
      cancelled = true
    }
  }, [canSee, id])

  async function revokeAll() {
    if (busy || reason.trim().length < 5) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPost<{ revoked: number }>(`/api/v1/admin/users/${id}/sessions`, {
      reason: reason.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'لغو نشست‌ها ناموفق بود')
      return
    }
    setDone(`${toPersianDigits(res.data?.revoked ?? 0)} نشست فعال لغو شد.`)
    await load()
  }

  return (
    <UserSubpage path="sessions">
      <Section
        title="نشست‌های کاربر"
        action={
          canManage && (
            <button
              type="button"
              onClick={() => void revokeAll()}
              disabled={busy || reason.trim().length < 5}
              className="bg-error/10 text-error hover:bg-error/20 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold disabled:opacity-40"
            >
              <IconBan className="size-3.5" />
              لغو همه نشست‌های فعال
            </button>
          )
        }
      >
        {!canSee ? (
          <Denied what="مشاهده نشست‌ها" />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : !rows ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : rows.length === 0 ? (
          <Empty text="نشستی ثبت نشده است" />
        ) : (
          <div className="space-y-4">
            {done && <SuccessBox msg={done} />}
            {canManage && (
              <div>
                <label htmlFor="session-reason" className={labelCls}>
                  دلیل لغو (حداقل ۵ نویسه — ثبت در ممیزی)
                </label>
                <input
                  id="session-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            <ul className="space-y-2">
              {rows.map((s) => (
                <li
                  key={s.id}
                  className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate">
                      {s.deviceInfo ?? s.userAgent ?? 'دستگاه ناشناس'}
                    </p>
                    <p className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                      {s.ip ?? '—'}
                    </p>
                  </div>
                  <div className="text-end">
                    <span
                      className={
                        s.active
                          ? 'text-success text-[11px] font-bold'
                          : 'text-muted-foreground text-[11px]'
                      }
                    >
                      {s.active ? 'فعال' : s.revokedAt ? 'لغوشده' : 'منقضی'}
                    </span>
                    <p className="text-muted-foreground text-[10px]">{fmtDate(s.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// ============================================================
// ۲۰) مسدود / فعال‌سازی
// ============================================================
export function UserBlockSection() {
  const { id } = useId()
  const { admin } = useAdmin()
  const canChange = hasPermission(admin.permissions, PERMISSIONS.USERS_STATUS)
  const [status, setStatus] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'BLOCKED'>('BLOCKED')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ profile: { status: string } }>(
        `/api/v1/admin/users/${id}/profile`,
      )
      if (!cancelled && res.ok && res.data) {
        setStatus(res.data.profile.status)
        setNewStatus(res.data.profile.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function apply() {
    if (busy || reason.trim().length < 5) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPatch(`/api/v1/admin/users/${id}/status`, {
      status: newStatus,
      reason: reason.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'تغییر وضعیت ناموفق بود')
      return
    }
    setStatus(newStatus)
    setDone(newStatus === 'BLOCKED' ? 'حساب مسدود و همه نشست‌ها لغو شد.' : 'حساب فعال شد.')
  }

  return (
    <UserSubpage path="block">
      <Section title="مسدودسازی / فعال‌سازی حساب">
        {!canChange ? (
          <Denied what="تغییر وضعیت حساب" />
        ) : (
          <div className="max-w-md space-y-4">
            {done && <SuccessBox msg={done} />}
            {error && <ErrorBox msg={error} />}
            <p className="text-muted-foreground text-xs">
              وضعیت فعلی:{' '}
              <span className="font-bold">
                {status === 'ACTIVE' ? 'فعال' : status === 'BLOCKED' ? 'مسدود' : 'حذف‌شده'}
              </span>
            </p>
            <div>
              <label htmlFor="block-status" className={labelCls}>
                وضعیت جدید
              </label>
              <select
                id="block-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
                className={inputCls}
              >
                <option value="ACTIVE">فعال</option>
                <option value="BLOCKED">مسدود</option>
              </select>
            </div>
            <p className="text-warning bg-warning/10 rounded-xl p-3 text-[11px] leading-5">
              مسدودسازی بلافاصله همه نشست‌های فعال کاربر را لغو می‌کند و اعلان به او ارسال می‌شود.
            </p>
            <div>
              <label htmlFor="block-reason" className={labelCls}>
                دلیل (حداقل ۵ نویسه — الزامی)
              </label>
              <textarea
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={cn(inputCls, 'h-auto py-2')}
              />
            </div>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy || reason.trim().length < 5}
              className={cn(
                btnPrimary,
                newStatus === 'BLOCKED' && 'bg-error hover:bg-error/90 text-white',
              )}
            >
              <IconBan className="size-4" />
              {busy ? 'در حال اعمال…' : 'اعمال وضعیت'}
            </button>
          </div>
        )}
      </Section>
    </UserSubpage>
  )
}

// helper مشترک برای استخراج id از params
import { useParams } from 'next/navigation'
function useId(): { id: string } {
  const { id } = useParams<{ id: string }>()
  return { id }
}
