// ============================================
// Zar30 - Admin Dashboard (Real Data)
// ============================================
// شاخص‌های عملیاتی از /api/v1/admin/dashboard — هیچ داده fake
// states: loading skeleton / error + retry / unavailable برای قیمت طلا
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpFromLine,
  ClipboardList,
  Coins,
  LifeBuoy,
  RefreshCw,
  Tag,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { AdminDashboardData } from '@/lib/services/admin-dashboard.service'
import { AdminMetric } from '@/components/admin/admin-metric'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری داشبورد">
      <div className="skeleton-shimmer mb-6 h-24 rounded-2xl" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton-shimmer h-52 rounded-xl" />
        <div className="skeleton-shimmer h-52 rounded-xl" />
      </div>
    </div>
  )
}

function QueueLink({
  href,
  icon: Icon,
  label,
  count,
  tone,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  count: number
  tone: 'default' | 'warning' | 'error'
}) {
  return (
    <Link
      href={href}
      className="border-border/60 bg-card hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="text-muted-foreground size-5 shrink-0" strokeWidth={1.75} />
        <span className="text-foreground truncate text-sm font-medium">{label}</span>
      </span>
      <span
        className={
          tone === 'error'
            ? 'text-error text-lg font-bold tabular-nums'
            : tone === 'warning'
              ? 'text-warning text-lg font-bold tabular-nums'
              : 'text-foreground text-lg font-bold tabular-nums'
        }
      >
        {toPersianDigits(count)}
      </span>
    </Link>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ dashboard: AdminDashboardData }>(
        '/api/v1/admin/dashboard',
      )
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری داشبورد ناموفق بود')
        return
      }
      setError(null)
      setData(res.data!.dashboard)
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (error && !data) {
    return (
      <div className="bg-card border-border/60 flex flex-col items-center rounded-2xl border p-10 text-center">
        <AlertTriangle className="text-error mb-3 size-8" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-foreground text-sm font-semibold">خطا در بارگذاری داشبورد</p>
        <p className="text-muted-foreground mt-1 text-xs">{error}</p>
        <button
          type="button"
          onClick={() => {
            setData(null)
            setError(null)
            setReloadKey((k) => k + 1)
          }}
          className="border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring mt-4 inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <RefreshCw className="size-3.5" strokeWidth={1.75} />
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />

  const generated = new Date(data.generatedAt).toLocaleString('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const price = data.financial.latestGoldPrice

  return (
    <div>
      <AdminPageHeader
        title="داشبورد عملیاتی"
        eyebrow="مرکز عملیات"
        description="شاخص‌های کلیدی پلتفرم — داده‌های عملیاتی از PostgreSQL"
      />

      {/* ===== Hero — context اجرایی ===== */}
      <div className="from-navy-900 to-navy-950 border-navy-700/40 mb-6 rounded-2xl border bg-gradient-to-l p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-cream-100 text-sm font-semibold sm:text-base">
              آخرین وضعیت ثبت‌شده پلتفرم
            </p>
            <p className="text-navy-300/70 mt-1 text-[11px] tabular-nums">
              تولیدشده در {generated}
            </p>
          </div>
          {price ? (
            <div className="text-left" dir="ltr">
              <p className="text-navy-300/70 text-[10px]">آخرین قیمت طلا — {price.source}</p>
              <p className="text-gold-300 mt-0.5 text-sm font-bold tabular-nums" dir="rtl">
                خرید {formatExactAmount(price.buyPrice)} ریال · فروش{' '}
                {formatExactAmount(price.sellPrice)} ریال
              </p>
              <p className="text-navy-300/60 mt-0.5 text-[10px] tabular-nums" dir="rtl">
                اسپرد {formatExactAmount(price.spread)}٪ —{' '}
                {new Date(price.recordedAt).toLocaleString('fa-IR', { timeStyle: 'short' })}
              </p>
            </div>
          ) : (
            <p className="border-navy-700/40 text-navy-300/70 rounded-lg border border-dashed px-3 py-2 text-[11px]">
              قیمت طلا در دسترس نیست — هیچ رکوردی ثبت نشده است
            </p>
          )}
        </div>
      </div>

      {/* ===== Financial strip ===== */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric
          label="مانده حساب‌های ریالی کاربران"
          value={formatExactAmount(data.financial.rialBalance)}
          unit="ریال"
          icon={Wallet}
        />
        <AdminMetric
          label="موجودی طلای کاربران"
          value={formatExactAmount(data.financial.goldBalance)}
          unit="گرم"
          icon={Coins}
          tone="gold"
        />
        <AdminMetric
          label="حجم تراکنش — ۲۴ ساعت اخیر"
          value={formatExactAmount(data.financial.completedVolumeLast24Hours)}
          unit="ریال"
          icon={Tag}
        />
        <AdminMetric
          label="برداشت‌های در انتظار"
          value={data.financial.pendingWithdrawals}
          icon={ArrowUpFromLine}
          tone={data.financial.pendingWithdrawals > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== Customers + KYC pipeline ===== */}
        <section className="bg-card border-border/60 rounded-xl border p-5">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-bold">
            <Users className="text-muted-foreground size-4" strokeWidth={1.75} aria-hidden="true" />
            مشتریان و احراز هویت
          </h2>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-foreground text-lg font-bold tabular-nums">
                {toPersianDigits(data.customers.total)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">کل کاربران</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-success text-lg font-bold tabular-nums">
                {toPersianDigits(data.customers.active)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">فعال</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-foreground text-lg font-bold tabular-nums">
                {toPersianDigits(data.customers.newLast24Hours)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">جدید — ۲۴ ساعت اخیر</p>
            </div>
          </div>
          <ul className="space-y-2 text-xs">
            {[
              ['در صف بررسی', data.kyc.submitted],
              ['در حال بررسی', data.kyc.underReview],
              ['تاییدشده', data.kyc.approved],
              ['نیازمند اقدام', data.kyc.needsAction],
            ].map(([label, count]) => (
              <li key={label as string} className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <UserCheck className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </span>
                <span className="text-foreground font-semibold tabular-nums">
                  {toPersianDigits(count as number)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Operational queues — لینک به صفحات ===== */}
        <section className="bg-card border-border/60 rounded-xl border p-5">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-bold">
            <ClipboardList
              className="text-muted-foreground size-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            صف‌های عملیاتی
          </h2>
          <div className="space-y-2.5">
            <QueueLink
              href="/admin/kyc"
              icon={UserCheck}
              label="احراز هویت در انتظار بررسی"
              count={data.kyc.submitted + data.kyc.underReview}
              tone={data.kyc.submitted + data.kyc.underReview > 0 ? 'warning' : 'default'}
            />
            <QueueLink
              href="/admin/orders"
              icon={ClipboardList}
              label="سفارش‌های در انتظار"
              count={data.operations.pendingOrders}
              tone={data.operations.pendingOrders > 0 ? 'warning' : 'default'}
            />
            <QueueLink
              href="/admin/support"
              icon={LifeBuoy}
              label="تیکت‌های باز"
              count={data.operations.openTickets}
              tone="default"
            />
            <QueueLink
              href="/admin/transactions"
              icon={AlertTriangle}
              label="تراکنش‌های ناموفق"
              count={data.operations.failedTransactions}
              tone={data.operations.failedTransactions > 0 ? 'error' : 'default'}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
