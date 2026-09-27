// ============================================
// Zar30 - Admin Users List (Client) — Redesigned
// ============================================
// URL query = source of truth؛ search با debounce 300ms
// کارت‌های آماری + جدول پیشرفته با اکشن‌های ریز per-user
// هر دکمه → زیرصفحه اختصاصی /admin/users/[id]/<section>
// ============================================

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCoin,
  IconPhone,
  IconRefresh,
  IconUserCircle,
  IconUsers,
  IconUserX,
  IconWallet,
} from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminUserListRow } from '@/lib/services/admin-user.service'
import { AdminFilterBar } from '@/components/admin/admin-filter-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { UserRowActionsGrid } from '@/components/admin/user-row-actions-grid'
import { useAdmin } from '@/components/admin/admin-shell'
import { formatExactAmount, formatGoldAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

const KYC_LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'سطح ۰',
  LEVEL_1: 'سطح ۱',
  LEVEL_2: 'سطح ۲',
  LEVEL_3: 'سطح ۳',
}

const selectClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

// ---------- کارت آماری ----------
function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string; stroke?: number | string }>
  tone?: 'neutral' | 'gold' | 'success' | 'error'
}) {
  const toneCls = {
    neutral: 'text-foreground',
    gold: 'text-gold-700 dark:text-gold-400',
    success: 'text-success',
    error: 'text-error',
  }[tone]
  return (
    <div className="bg-card border-border/60 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <Icon className={cn('size-4', toneCls)} stroke={1.75} aria-hidden="true" />
      </div>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', toneCls)}>{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-[10px]">{hint}</p>}
    </div>
  )
}

export function AdminUsersClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { admin } = useAdmin()

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const kycLevel = searchParams.get('kycLevel') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const direction = searchParams.get('direction') ?? 'desc'

  const [searchInput, setSearchInput] = useState(q)
  const [rows, setRows] = useState<AdminUserListRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // debounce جستجو → URL
  function onSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value, page: '1' })
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // fetch — هر تغییر query؛ stale-while-revalidate
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (kycLevel) params.set('kycLevel', kycLevel)
    params.set('sortBy', sortBy)
    params.set('direction', direction)
    ;(async () => {
      const res = await apiGetWithRefresh<{ users: AdminUserListRow[] }>(
        `/api/v1/admin/users?${params.toString()}`,
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setRows([])
        setError(res.error ?? 'بارگذاری کاربران ناموفق بود')
        return
      }
      setError(null)
      setRows(res.data?.users ?? [])
      setTotal(Number(res.meta?.total ?? 0))
      setTotalPages(Number(res.meta?.totalPages ?? 1))
    })()
    return () => {
      cancelled = true
    }
  }, [page, q, status, kycLevel, sortBy, direction])

  const hasFilters = !!(q || status || kycLevel)

  return (
    <div>
      <AdminPageHeader
        title="کاربران"
        eyebrow="مشتریان"
        description="مدیریت کامل کاربران — ویرایش، کیف پول، سفارشات، احراز هویت و کنترل دسترسی"
      />

      {/* کارت‌های آماری از داده صفحه فعلی */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="کاربران این صفحه"
          value={rows ? toPersianDigits(rows.length) : '…'}
          hint={rows ? `از مجموع ${toPersianDigits(total)} کاربر` : undefined}
          icon={IconUsers}
          tone="gold"
        />
        <StatCard
          label="فعال / مسدود"
          value={
            rows
              ? `${toPersianDigits(rows.filter((r) => r.status === 'ACTIVE').length)} / ${toPersianDigits(rows.filter((r) => r.status === 'BLOCKED').length)}`
              : '…'
          }
          icon={IconUserCircle}
        />
        <StatCard
          label="مجموع طلا (این صفحه)"
          value={
            rows
              ? formatGoldAmount(rows.reduce((acc, r) => acc + Number(r.goldBalance), 0).toFixed(8))
              : '…'
          }
          hint="گرم"
          icon={IconCoin}
          tone="gold"
        />
        <StatCard
          label="مجموع تومان (این صفحه)"
          value={
            rows
              ? formatExactAmount(
                  BigInt(Math.round(rows.reduce((acc, r) => acc + Number(r.tomanBalance), 0))),
                )
              : '…'
          }
          hint="تومان"
          icon={IconWallet}
        />
      </div>

      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="جستجو: موبایل، نام، ایمیل…"
        hasActiveFilters={hasFilters}
        onClear={() => {
          setSearchInput('')
          updateParams({ q: '', status: '', kycLevel: '', page: '1' })
        }}
      >
        <select
          aria-label="فیلتر وضعیت"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="ACTIVE">فعال</option>
          <option value="BLOCKED">مسدود</option>
          <option value="DELETED">حذف‌شده</option>
        </select>
        <select
          aria-label="فیلتر سطح احراز هویت"
          value={kycLevel}
          onChange={(e) => updateParams({ kycLevel: e.target.value, page: '1' })}
          className={selectClass}
        >
          <option value="">همه سطوح KYC</option>
          <option value="LEVEL_0">سطح ۰</option>
          <option value="LEVEL_1">سطح ۱</option>
          <option value="LEVEL_2">سطح ۲</option>
          <option value="LEVEL_3">سطح ۳</option>
        </select>
        <select
          aria-label="مرتب‌سازی"
          value={`${sortBy}:${direction}`}
          onChange={(e) => {
            const [s, d] = e.target.value.split(':')
            updateParams({ sortBy: s ?? 'createdAt', direction: d ?? 'desc', page: '1' })
          }}
          className={selectClass}
        >
          <option value="createdAt:desc">جدیدترین</option>
          <option value="createdAt:asc">قدیمی‌ترین</option>
          <option value="lastLoginAt:desc">آخرین فعالیت (جدید)</option>
          <option value="lastLoginAt:asc">آخرین فعالیت (قدیم)</option>
          <option value="creditScore:desc">بالاترین امتیاز اعتباری</option>
          <option value="mobile:asc">موبایل (الفبا)</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            updateParams({ _: String(Date.now()) })
          }}
          title="بازخوانی"
          aria-label="بازخوانی لیست"
          className="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconRefresh className={cn('size-4', loading && 'animate-spin')} stroke={1.75} />
        </button>
      </AdminFilterBar>

      {/* جدول expandable اختصاصی — اکشن‌های جفتی زیر مشخصات هر ردیف */}
      <UsersExpandableTable
        rows={rows}
        loading={loading}
        error={error}
        permissions={admin.permissions}
      />

      <AdminPagination page={page} totalPages={totalPages} total={total} />

      <p className="text-muted-foreground/70 mt-3 flex items-center gap-1.5 text-[10px]">
        <IconUserX className="size-3.5" aria-hidden="true" />۷ اقدام اصلی زیر هر کاربر — بقیه
        اقدامات (همگام‌سازی، انتقال‌ها، درگاه، زرکار، دعوت‌ها، کارمزد، سطح، پیامک، ریسک، اعتبار،
        نشست‌ها) در زیرصفحه‌های اختصاصی از طریق ناوبری صفحه کاربر در دسترس‌اند.
      </p>
    </div>
  )
}

// ============================================================
// جدول کاربران — ردیف اطلاعات + ردیف اکشن‌های همیشه‌نمایان
// دسکتاپ: جدول — موبایل: کارت
// ============================================================
function UsersExpandableTable({
  rows,
  loading,
  error,
  permissions,
}: {
  rows: AdminUserListRow[] | null
  loading: boolean
  error: string | null
  permissions: ReturnType<typeof useAdmin>['admin']['permissions']
}) {
  if (error) {
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

  if (loading || !rows) {
    return (
      <div aria-busy="true" aria-label="در حال بارگذاری جدول" className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        کاربری با این فیلترها یافت نشد
      </div>
    )
  }

  return (
    <>
      {/* دسکتاپ */}
      <div className="border-border/60 hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 bg-muted/40 border-b">
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                کاربر
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                نام کاربری
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                موبایل
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                سطح KYC
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                وضعیت
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                کیف تومان
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                طلا (گرم)
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                فعالیت
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-3 py-3 text-right text-[11px] font-semibold whitespace-nowrap"
              >
                آخرین ورود
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              return (
                <Fragment key={u.id}>
                  <tr className="border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/users/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-foreground hover:text-gold-600 dark:hover:text-gold-400 block truncate text-sm font-medium transition-colors"
                        >
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                        </Link>
                        <span
                          className="text-muted-foreground block truncate text-[11px] tabular-nums"
                          dir="ltr"
                        >
                          {u.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="bg-muted text-muted-foreground inline-flex max-w-32 items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
                        dir="ltr"
                      >
                        {u.referralCode}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums" dir="ltr">
                          {toPersianDigits(u.mobile)}
                        </span>
                        <a
                          href={`tel:${u.mobile}`}
                          title="تماس مستقیم"
                          aria-label={`تماس با ${toPersianDigits(u.mobile)}`}
                          className="text-muted-foreground hover:bg-success/10 hover:text-success inline-flex size-5 shrink-0 items-center justify-center rounded-md transition-colors"
                        >
                          <IconPhone className="size-3" stroke={1.75} aria-hidden="true" />
                        </a>
                        <a
                          href={`https://wa.me/98${u.mobile.slice(1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="واتساپ"
                          aria-label={`واتساپ به ${toPersianDigits(u.mobile)}`}
                          className="text-muted-foreground hover:bg-success/10 hover:text-success inline-flex size-5 shrink-0 items-center justify-center rounded-md transition-colors"
                        >
                          <IconBrandWhatsapp className="size-3" stroke={1.75} aria-hidden="true" />
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          u.kycLevel === 'LEVEL_0'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-success/10 text-success',
                        )}
                      >
                        {KYC_LEVEL_LABELS[u.kycLevel] ?? u.kycLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <AdminStatus status={u.status} />
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className="text-foreground text-xs font-medium">
                        {formatExactAmount(u.tomanBalance)}
                      </span>
                      {Number(u.tomanLockedBalance) > 0 && (
                        <span className="text-warning block text-[10px]">
                          قفل: {formatExactAmount(u.tomanLockedBalance)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className="text-gold-700 dark:text-gold-400 text-xs font-medium">
                        {formatGoldAmount(u.goldBalance)}
                      </span>
                      {Number(u.goldLockedBalance) > 0 && (
                        <span className="text-warning block text-[10px]">
                          قفل: {formatGoldAmount(u.goldLockedBalance)}
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-3 text-[11px] tabular-nums">
                      {toPersianDigits(u.counts.orders)} سفارش ·{' '}
                      {toPersianDigits(u.counts.transactions)} تراکنش
                    </td>
                    <td className="text-muted-foreground px-3 py-3 text-[11px] tabular-nums">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fa-IR') : '—'}
                    </td>
                  </tr>
                  {/* ردیف اکشن‌ها — خط افقی بعد از دکمه‌ها (جداسازی کاربران) */}
                  <tr className="border-border/40 border-b">
                    <td colSpan={10} className="px-4 pt-0 pb-3">
                      <UserRowActionsGrid userId={u.id} permissions={permissions} />
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* موبایل — کارت‌ها با گرید اکشن */}
      <ul className="space-y-3 md:hidden">
        {rows.map((u) => (
          <li key={u.id} className="bg-card border-border/60 rounded-xl border p-4 shadow-xs">
            <dl className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">کاربر</dt>
                <dd className="text-foreground min-w-0 truncate text-xs font-medium">
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">موبایل</dt>
                <dd className="flex items-center gap-2">
                  <span className="text-foreground text-xs tabular-nums" dir="ltr">
                    {toPersianDigits(u.mobile)}
                  </span>
                  <a
                    href={`tel:${u.mobile}`}
                    aria-label="تماس مستقیم"
                    className="text-muted-foreground hover:text-success inline-flex size-6 items-center justify-center rounded-md transition-colors"
                  >
                    <IconPhone className="size-3.5" stroke={1.75} aria-hidden="true" />
                  </a>
                  <a
                    href={`https://wa.me/98${u.mobile.slice(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="واتساپ"
                    className="text-muted-foreground hover:text-success inline-flex size-6 items-center justify-center rounded-md transition-colors"
                  >
                    <IconBrandWhatsapp className="size-3.5" stroke={1.75} aria-hidden="true" />
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">نام کاربری</dt>
                <dd className="text-foreground text-xs tabular-nums" dir="ltr">
                  {u.referralCode}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">تومان</dt>
                <dd className="text-foreground text-xs tabular-nums">
                  {formatExactAmount(u.tomanBalance)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">طلا</dt>
                <dd className="text-gold-700 dark:text-gold-400 text-xs tabular-nums">
                  {formatGoldAmount(u.goldBalance)} گرم
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0 text-[11px]">وضعیت</dt>
                <dd>
                  <AdminStatus status={u.status} />
                </dd>
              </div>
            </dl>
            <UserRowActionsGrid userId={u.id} permissions={permissions} />
          </li>
        ))}
      </ul>
    </>
  )
}
