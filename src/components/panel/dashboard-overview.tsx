// ============================================
// Zarnama - Dashboard Overview (Phase 3)
// ============================================
// خلاصه حساب — همه داده‌های مالی Placeholder/Empty State هستند
// هیچ balance/transaction واقعی در این Phase مصرف نمی‌شود
// ============================================

'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Coins,
  Gift,
  History,
  KeyRound,
  LifeBuoy,
  MonitorSmartphone,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gold inline-flex items-center gap-1 text-sm hover:underline">
      {children}
      <ArrowLeft className="size-3.5" />
    </Link>
  )
}

export function DashboardOverview() {
  const { user } = usePanelUser()
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      {/* Welcome + account status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            خوش آمدید{displayName ? `، ${displayName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
            {user.mobile}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {STATUS_LABELS[user.status] ?? user.status}
        </Badge>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/dashboard/profile', label: 'ویرایش پروفایل', icon: UserCheck },
          { href: '/dashboard/security', label: 'تغییر رمز عبور', icon: KeyRound },
          { href: '/dashboard/sessions', label: 'مدیریت نشست‌ها', icon: MonitorSmartphone },
          { href: '/dashboard/notifications', label: 'اعلان‌ها', icon: Bell },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="border-border/60 bg-card/50 hover:border-gold/40 hover:bg-card flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors"
          >
            <Icon className="text-gold size-6" />
            <span className="text-foreground text-sm">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* KYC status preview — workflow در Phase 4 */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="text-gold size-5" />
              وضعیت احراز هویت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="secondary">{KYC_LABELS[user.kycLevel] ?? user.kycLevel}</Badge>
            <p className="text-muted-foreground text-sm">
              تکمیل احراز هویت در مرحله بعد فعال می‌شود.
            </p>
            <SectionLink href="/dashboard/profile">مشاهده پروفایل</SectionLink>
          </CardContent>
        </Card>

        {/* Asset summary — Placeholder (Financial Core در Phaseهای بعدی) */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="text-gold size-5" />
              خلاصه دارایی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <Coins className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                کیف پول ریالی و طلایی به‌زودی فعال می‌شود
              </p>
              <Badge variant="outline" className="text-xs">
                به‌زودی — پیش‌نمایش
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent transactions — Placeholder */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-gold size-5" />
              تراکنش‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <p className="text-muted-foreground text-sm">هنوز تراکنشی ثبت نشده است</p>
              <Badge variant="outline" className="text-xs">
                به‌زودی — پیش‌نمایش
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Referral preview */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="text-gold size-5" />
              معرفی دوستان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">کد دعوت شما</span>
              <span className="text-foreground font-mono font-medium" dir="ltr">
                {user.referralCode}
              </span>
            </div>
            <SectionLink href="/dashboard/referral">جزئیات بیشتر</SectionLink>
          </CardContent>
        </Card>

        {/* Support preview */}
        <Card className="border-border/60 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="text-gold size-5" />
              پشتیبانی
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              برای ارتباط با پشتیبانی زرنما از بخش تیکت استفاده کنید.
            </p>
            <SectionLink href="/dashboard/support">رفتن به پشتیبانی</SectionLink>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
