// ============================================
// Zarnama - Dashboard Overview (Phase 3.1 — Premium Redesign)
// ============================================
// سلسله‌مراتب: Greeting → خلاصه مالی → Quick Actions → دارایی →
// بازار → فعالیت اخیر → قسطی → امنیت/KYC → معرفی
// داده‌های مالی Placeholder هستند — Financial Core در Phaseهای بعدی
// ============================================

'use client'

import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  Bell,
  CalendarClock,
  Coins,
  Gift,
  History,
  LineChart,
  MonitorSmartphone,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BalanceCard } from '@/components/financial/balance-card'
import { StatusCard } from '@/components/financial/status-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'

const KYC_LABELS: Record<string, string> = {
  LEVEL_0: 'احراز نشده',
  LEVEL_1: 'سطح ۱ — موبایل تایید شده',
  LEVEL_2: 'سطح ۲ — هویتی',
  LEVEL_3: 'سطح ۳ — کامل',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  BLOCKED: 'مسدود',
  DELETED: 'حذف‌شده',
}

// اکشن‌های سریع — ورود به مقصدهای قرارداد ناوبری
const QUICK_ACTIONS = [
  { href: '/dashboard/trade', label: 'خرید طلا', icon: ArrowDownLeft, accent: 'gold' },
  { href: '/dashboard/trade', label: 'فروش طلا', icon: ArrowUpLeft, accent: 'navy' },
  { href: '/dashboard/assets', label: 'کیف پول', icon: Wallet, accent: 'navy' },
  { href: '/dashboard/installments', label: 'خرید قسطی', icon: CalendarClock, accent: 'navy' },
] as const

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
    >
      {children}
      <ArrowLeft className="size-3.5" />
    </Link>
  )
}

export function DashboardOverview() {
  const { user } = usePanelUser()
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const kycDone = user.kycLevel !== 'LEVEL_0'

  return (
    <div className="space-y-6">
      {/* ============ ۱. Account Greeting ============ */}
      <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-foreground">
            خوش آمدید{displayName ? `، ${displayName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <span dir="ltr">{user.mobile}</span>
            <span aria-hidden="true">·</span>
            <StatusBadge tone={user.status === 'ACTIVE' ? 'success' : 'error'}>
              {STATUS_LABELS[user.status] ?? user.status}
            </StatusBadge>
          </p>
        </div>
      </div>

      {/* ============ ۲. Main Financial Summary ============ */}
      <div className="animate-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard variant="total" amount={0} subtitle="مجموع دارایی شما" />
        <BalanceCard variant="gold" amount={0} subtitle="طلای آب‌شده ۱۸ عیار" />
        <BalanceCard
          variant="fiat"
          amount={0}
          subtitle="کیف پول تومانی"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* ============ ۳. Quick Actions ============ */}
      <div className="animate-stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={label}
            href={href}
            className={
              accent === 'gold'
                ? 'border-gold-500/30 from-gold-500/12 to-card hover:border-gold-500/50 hover:shadow-gold group flex flex-col items-center gap-2.5 rounded-xl border bg-gradient-to-bl p-4 text-center transition-all duration-(--duration-normal) hover:-translate-y-0.5'
                : 'border-border/60 bg-card hover:border-border-strong group flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-sm'
            }
          >
            <span
              className={
                accent === 'gold'
                  ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400 flex size-11 items-center justify-center rounded-xl transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-110'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground flex size-11 items-center justify-center rounded-xl transition-all duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-110'
              }
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-foreground text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ============ ۴. بازار — قیمت لحظه‌ای ============ */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="text-gold-500 size-5" strokeWidth={1.75} />
              قیمت لحظه‌ای طلا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Coins}
              title="قیمت لحظه‌ای به‌زودی فعال می‌شود"
              description="نرخ لحظه‌ای خرید و فروش طلای آب‌شده پس از راه‌اندازی موتور قیمت‌گذاری اینجا نمایش داده می‌شود."
              badge="به‌زودی — پیش‌نمایش"
            />
          </CardContent>
        </Card>

        {/* ============ ۵. فعالیت اخیر ============ */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-gold-500 size-5" strokeWidth={1.75} />
              فعالیت اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={History}
              title="هنوز تراکنشی ثبت نشده است"
              description="خرید، فروش، واریز و برداشت شما اینجا نمایش داده می‌شود."
            />
            <div className="mt-3 text-center">
              <SectionLink href="/dashboard/assets">مشاهده دارایی</SectionLink>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ============ ۶. خلاصه قسطی ============ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="text-gold-500 size-5" strokeWidth={1.75} />
              خرید قسطی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs leading-5">
              طرح‌های اقساطی خرید طلا به‌زودی معرفی می‌شوند.
            </p>
            <StatusBadge tone="gold" dot={false}>
              به‌زودی — پیش‌نمایش
            </StatusBadge>
            <div>
              <SectionLink href="/dashboard/installments">مشاهده طرح‌ها</SectionLink>
            </div>
          </CardContent>
        </Card>

        {/* ============ ۷. امنیت و KYC ============ */}
        <StatusCard
          icon={ShieldCheck}
          title="احراز هویت"
          statusLabel={KYC_LABELS[user.kycLevel] ?? user.kycLevel}
          statusTone={kycDone ? 'success' : 'warning'}
          description={
            kycDone
              ? 'احراز هویت شما تکمیل شده است.'
              : 'برای فعال شدن خرید و فروش، احراز هویت را تکمیل کنید.'
          }
          progress={kycDone ? 100 : 25}
          action={{ label: 'مدیریت احراز هویت', href: '/dashboard/profile' }}
        />
        <StatusCard
          icon={MonitorSmartphone}
          title="امنیت حساب"
          statusLabel={user.mobileVerifiedAt ? 'موبایل تایید شده' : 'نیاز به تایید موبایل'}
          statusTone={user.mobileVerifiedAt ? 'success' : 'warning'}
          description="نشست‌ها، رمز عبور و احراز دو مرحله‌ای را مدیریت کنید."
          action={{ label: 'مرکز امنیت', href: '/dashboard/profile/security' }}
        />
      </div>

      {/* ============ ۸. معرفی + اعلان ============ */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="text-gold-500 size-5" strokeWidth={1.75} />
              معرفی دوستان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">کد دعوت شما</span>
              <span className="text-foreground font-mono font-semibold tracking-widest" dir="ltr">
                {user.referralCode}
              </span>
            </div>
            <SectionLink href="/dashboard/profile/referral">جزئیات و پاداش</SectionLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="text-gold-500 size-5" strokeWidth={1.75} />
              اعلان‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs leading-5">
              اعلان‌های مهم حساب را از مرکز اعلان‌ها دنبال کنید.
            </p>
            <SectionLink href="/dashboard/notifications">مشاهده اعلان‌ها</SectionLink>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
