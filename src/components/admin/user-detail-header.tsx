// ============================================
// Zar30 - User Detail Header (Shared) — v2
// ============================================
// کارت اطلاعات کامل کاربر + ناوبری عمودی همه بخش‌ها
// تب‌ها زیر هم (بدون overflow بیرون‌زده) در سایدبار کنار محتوا
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconArrowRight,
  IconIdBadge2,
  IconCoin,
  IconWallet,
  IconShieldCheck,
} from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { AdminStatus } from '@/components/admin/admin-status'
import { formatExactAmount, formatGoldAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

interface OverviewData {
  user: {
    id: string
    mobile: string
    name: string
    status: string
    kycLevel: string
    creditScore: number
  }
  counts: Record<string, number>
  balances: { assetType: string; balance: string; lockedBalance: string }[] | null
  can: Record<string, boolean>
}

const TABS: { key: string; label: string; path: string; canKey?: string }[] = [
  { key: 'edit', label: 'ویرایش مشخصات', path: 'edit', canKey: 'update' },
  { key: 'bank', label: 'کارت و شبا', path: 'bank-accounts', canKey: 'bankAccounts' },
  { key: 'kyc', label: 'احراز هویت', path: 'kyc', canKey: 'kyc' },
  { key: 'level', label: 'تغییر سطح', path: 'level', canKey: 'kycApprove' },
  { key: 'wallet', label: 'کیف پول طلا / تومان', path: 'wallet', canKey: 'wallets' },
  { key: 'orders', label: 'سفارشات', path: 'orders', canKey: 'orders' },
  { key: 'sync', label: 'همگام‌سازی سفارشات', path: 'sync', canKey: 'freeze' },
  { key: 'transactions', label: 'تراکنش‌های مالی', path: 'transactions', canKey: 'transactions' },
  { key: 'transfers', label: 'انتقال‌ها', path: 'transfers', canKey: 'transfers' },
  { key: 'payments', label: 'تراکنش‌های درگاه', path: 'payments', canKey: 'payments' },
  { key: 'deliveries', label: 'تحویل فیزیکی', path: 'deliveries', canKey: 'delivery' },
  { key: 'installments', label: 'خرید قسطی', path: 'installments', canKey: 'installments' },
  { key: 'investments', label: 'زرکار (سرمایه‌گذاری)', path: 'investments', canKey: 'investments' },
  { key: 'referrals', label: 'دعوت دوستان', path: 'referrals', canKey: 'referrals' },
  { key: 'fees', label: 'کارمزد', path: 'fees', canKey: 'fees' },
  { key: 'message', label: 'ارسال پیامک', path: 'message', canKey: 'message' },
  { key: 'risk', label: 'مشکوک (ریسک)', path: 'risk', canKey: 'risk' },
  { key: 'credit2', label: 'اعتبارها', path: 'credit', canKey: 'riskReview' },
  { key: 'sessions', label: 'نشست‌ها', path: 'sessions', canKey: 'security' },
  { key: 'block', label: 'مسدود / فعال‌سازی', path: 'block', canKey: 'status' },
]

export function UserDetailHeader({ userId }: { userId: string }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ overview: OverviewData }>(
        `/api/v1/admin/users/${userId}/overview`,
      )
      if (cancelled) return
      if (res.ok && res.data) setData(res.data.overview)
      else setError(res.error ?? 'بارگذاری اطلاعات ناموفق بود')
    })()
    return () => {
      cancelled = true
    }
  }, [userId, pathname])

  const u = data?.user
  const toman = data?.balances?.find((b) => b.assetType === 'TOMAN')
  const gold = data?.balances?.find((b) => b.assetType === 'GOLD')
  const visibleTabs = TABS.filter((t) => !t.canKey || data?.can?.[t.canKey] !== false)

  return (
    <div className="mb-6">
      <Link
        href="/admin/users"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors"
      >
        <IconArrowRight className="size-3.5" aria-hidden="true" />
        بازگشت به لیست کاربران
      </Link>

      {/* ===== کارت اطلاعات کامل کاربر ===== */}
      <div className="bg-card border-border/60 mt-3 rounded-xl border p-5">
        {error && !u ? (
          <p role="alert" className="text-error text-xs">
            {error}
          </p>
        ) : !u ? (
          <div className="skeleton-shimmer h-32 rounded-xl" />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              {/* هویت */}
              <div className="flex min-w-0 items-center gap-4">
                <span className="from-gold-500/30 to-gold-600/20 text-gold-700 dark:text-gold-300 ring-gold-500/30 flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-lg font-bold ring-1">
                  {u.name.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-foreground truncate text-lg font-bold">{u.name}</h1>
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums" dir="ltr">
                    {toPersianDigits(u.mobile)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <AdminStatus status={u.status} />
                    <span className="border-border/60 bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]">
                      <IconIdBadge2 className="size-3" aria-hidden="true" />
                      سطح {toPersianDigits(u.kycLevel.replace('LEVEL_', ''))}
                    </span>
                    <span className="border-border/60 bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]">
                      <IconShieldCheck className="size-3" aria-hidden="true" />
                      اعتبار: {toPersianDigits(u.creditScore)}
                    </span>
                  </div>
                </div>
              </div>

              {/* موجودی‌ها */}
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {toman && (
                  <div className="border-border/60 bg-muted/40 min-w-28 rounded-xl border px-4 py-2.5 text-center">
                    <p className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
                      <IconWallet className="size-3" aria-hidden="true" />
                      کیف تومانی
                    </p>
                    <p className="text-foreground mt-0.5 text-sm font-bold tabular-nums">
                      {formatExactAmount(toman.balance)}
                      <span className="text-muted-foreground ms-1 text-[9px] font-normal">
                        تومان
                      </span>
                    </p>
                    {Number(toman.lockedBalance) > 0 && (
                      <p className="text-warning text-[9px]">
                        قفل: {formatExactAmount(toman.lockedBalance)}
                      </p>
                    )}
                  </div>
                )}
                {gold && (
                  <div className="border-gold-500/30 bg-gold-500/5 min-w-28 rounded-xl border px-4 py-2.5 text-center">
                    <p className="text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1 text-[10px]">
                      <IconCoin className="size-3" aria-hidden="true" />
                      کیف طلایی
                    </p>
                    <p className="text-foreground mt-0.5 text-sm font-bold tabular-nums">
                      {formatGoldAmount(gold.balance)}
                      <span className="text-muted-foreground ms-1 text-[9px] font-normal">گرم</span>
                    </p>
                    {Number(gold.lockedBalance) > 0 && (
                      <p className="text-warning text-[9px]">
                        قفل: {formatGoldAmount(gold.lockedBalance)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* شمارنده‌های فعالیت */}
            <div className="border-border/40 mt-4 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4 lg:grid-cols-6">
              {[
                { label: 'سفارش', value: data?.counts.orders },
                { label: 'تراکنش', value: data?.counts.transactions },
                { label: 'درگاه', value: data?.counts.payments },
                { label: 'قسطی', value: data?.counts.installments },
                { label: 'زرکار', value: data?.counts.investments },
                { label: 'دعوت', value: data?.counts.referrals },
              ].map((c) => (
                <div key={c.label} className="text-center">
                  <p className="text-muted-foreground text-[10px]">{c.label}</p>
                  <p className="text-foreground text-sm font-bold tabular-nums">
                    {c.value != null ? toPersianDigits(c.value) : '—'}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground/60 mt-3 text-[10px] tabular-nums" dir="ltr">
              {u.id}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ناوبری عمودی — همه گزینه‌ها زیر هم، بدون overflow
export function UserSectionNav({
  userId,
  activePath,
  tabs,
}: {
  userId: string
  activePath: string
  tabs: { path: string; label: string }[]
}) {
  return (
    <nav aria-label="بخش‌های کاربر" className="bg-card border-border/60 rounded-xl border p-2">
      <ul className="space-y-0.5">
        {tabs.map((t) => {
          const active = activePath === t.path
          return (
            <li key={t.path}>
              <Link
                href={`/admin/users/${userId}/${t.path}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-lg px-3 py-2 text-xs transition-colors',
                  active
                    ? 'text-gold-700 dark:text-gold-400 bg-gold-500/10 font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// export تابع tabs برای استفاده در layout
export const USER_SECTION_TABS = TABS.map(({ path, label }) => ({ path, label }))
