// ============================================
// Zar30 - Dashboard Overview (Full Panel Redesign)
// ============================================
// سلسله‌مراتب: Wealth Hero → Quick Actions → بازار → نمودار دارایی →
// فعالیت اخیر → قسطی → امنیت/KYC → معرفی/اعلان
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
  Gift,
  History,
  LineChart,
  MonitorSmartphone,
  ShieldCheck,
  Timer,
  Wallet,
} from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { WealthHero } from './wealth-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusCard } from '@/components/financial/status-card'
import { PortfolioChart } from '@/components/financial/portfolio-chart'
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

// داده نمایشی نمودار — صرفاً برای پیش‌نمایش بصری؛ صراحتاً برچسب‌دار است
const DEMO_SERIES = [42, 44, 43.5, 46, 45, 48, 47.5, 50, 49, 52, 51.5, 54]

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
  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="animate-stagger space-y-5">
      {/* ============ ۱. Wealth Hero — قلب بصری ============ */}
      <WealthHero
        greeting={`خوش آمدید${displayName ? `، ${displayName}` : ''}`}
        dateLabel={today}
        totalValue={0}
        goldGrams={0}
        rialBalance={0}
        statusLabel={STATUS_LABELS[user.status] ?? user.status}
        statusTone={user.status === 'ACTIVE' ? 'success' : 'error'}
      />

      {/* ============ ۲. Quick Actions ============ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={label}
            href={href}
            className={
              accent === 'gold'
                ? 'border-gold-500/30 from-gold-500/12 to-card hover:border-gold-500/50 hover:shadow-gold group flex items-center gap-3 rounded-xl border bg-gradient-to-bl p-4 transition-all duration-(--duration-normal) hover:-translate-y-0.5 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center'
                : 'border-border/60 bg-card hover:border-gold-500/20 group flex items-center gap-3 rounded-xl border p-4 transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-md sm:flex-col sm:items-center sm:gap-2.5 sm:text-center'
            }
          >
            <span
              className={
                accent === 'gold'
                  ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400 flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-105'
                  : 'bg-muted text-muted-foreground group-hover:text-gold-500 flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-105'
              }
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-foreground text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ============ ۳. بازار — قیمت لحظه‌ای ============ */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="text-gold-500 size-5" strokeWidth={1.75} />
              قیمت لحظه‌ای طلا
              <StatusBadge tone="gold" dot={false}>
                پیش‌نمایش
              </StatusBadge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ساختار واقعی ویجت قیمت — خرید/فروش با مقادیر pending */}
            <div className="divide-border/40 grid grid-cols-2 divide-x divide-x-reverse">
              <div className="px-4 py-1 text-center">
                <p className="text-muted-foreground text-label mb-1.5">نرخ خرید</p>
                <p className="text-financial-lg text-foreground/40">—</p>
                <p className="text-muted-foreground text-[10px]">تومان / گرم</p>
              </div>
              <div className="px-4 py-1 text-center">
                <p className="text-muted-foreground text-label mb-1.5">نرخ فروش</p>
                <p className="text-financial-lg text-foreground/40">—</p>
                <p className="text-muted-foreground text-[10px]">تومان / گرم</p>
              </div>
            </div>
            <EmptyState
              icon={Timer}
              title="قیمت لحظه‌ای به‌زودی فعال می‌شود"
              description="نرخ لحظه‌ای خرید و فروش طلای آب‌شده پس از راه‌اندازی موتور قیمت‌گذاری اینجا نمایش داده می‌شود."
              badge="به‌زودی — پیش‌نمایش"
            />
          </CardContent>
        </Card>

        {/* ============ ۴. نمودار دارایی — داده نمایشی ============ */}
        <div className="lg:col-span-2">
          <PortfolioChart
            data={DEMO_SERIES}
            changePercent={4.2}
            title="روند دارایی (داده نمایشی)"
            height={170}
            className="h-full"
          />
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[10px]">
            <StatusBadge tone="neutral" dot={false} className="text-[9px]">
              داده نمایشی
            </StatusBadge>
            نمودار واقعی پس از اولین تراکنش فعال می‌شود.
          </p>
        </div>
      </div>

      {/* ============ ۵. فعالیت اخیر — stream ============ */}
      <Card>
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
            description="خرید، فروش، واریز و برداشت شما به‌صورت زمان‌بندی‌شده اینجا نمایش داده می‌شود."
            action={{ label: 'مشاهده دارایی', href: '/dashboard/assets' }}
          />
        </CardContent>
      </Card>

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
            <p className="text-muted-foreground text-xs leading-5 text-pretty">
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
          action={{ label: 'مدیریت احراز هویت', href: '/dashboard/profile/kyc' }}
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
              <span className="text-foreground font-mono font-semibold tabular-nums" dir="ltr">
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
            <p className="text-muted-foreground text-xs leading-5 text-pretty">
              اعلان‌های مهم حساب را از مرکز اعلان‌ها دنبال کنید.
            </p>
            <SectionLink href="/dashboard/notifications">مشاهده اعلان‌ها</SectionLink>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
