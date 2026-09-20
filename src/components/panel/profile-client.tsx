// ============================================
// Zar30 - Profile Hub (Phase 3.1 — Premium Redesign)
// ============================================
// هاب بخش پروفایل — اطلاعات شخصی + دسترسی به بخش‌های فرعی:
// امنیت، نشست‌ها، اعلان‌ها، معرفی، پشتیبانی، legal
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  FileText,
  Gift,
  LifeBuoy,
  LogOut,
  Mail,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { apiPut } from '@/lib/api/client'
import { usePanelUser, type PanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from './page-header'

const KYC_LABELS: Record<string, string> = {
  LEVEL_0: 'احراز نشده',
  LEVEL_1: 'سطح ۱ — موبایل تایید شده',
  LEVEL_2: 'سطح ۲ — هویتی',
  LEVEL_3: 'سطح ۳ — کامل',
}

// بخش‌های فرعی پروفایل — طبق قرارداد ناوبری همه زیر «پروفایل»
const PROFILE_SECTIONS = [
  {
    href: '/dashboard/profile/kyc',
    icon: BadgeCheck,
    title: 'احراز هویت',
    description: 'تایید هویت و ارتقای سطح حساب',
  },
  {
    href: '/dashboard/profile/security',
    icon: ShieldCheck,
    title: 'امنیت و رمز عبور',
    description: 'رمز عبور، ۲FA و رویدادهای امنیتی',
  },
  {
    href: '/dashboard/profile/sessions',
    icon: MonitorSmartphone,
    title: 'دستگاه‌ها و نشست‌ها',
    description: 'دستگاه‌های متصل و مدیریت نشست‌ها',
  },
  {
    href: '/dashboard/notifications',
    icon: Bell,
    title: 'اعلان‌ها',
    description: 'مرکز اعلان و تنظیمات اطلاع‌رسانی',
  },
  {
    href: '/dashboard/profile/referral',
    icon: Gift,
    title: 'معرفی دوستان',
    description: 'کد دعوت و پاداش معرفی',
  },
  {
    href: '/dashboard/profile/support',
    icon: LifeBuoy,
    title: 'پشتیبانی',
    description: 'تیکت و راه‌های ارتباطی',
  },
] as const

const LEGAL_LINKS = [
  { href: '/terms', label: 'شرایط استفاده' },
  { href: '/privacy', label: 'حریم خصوصی' },
] as const

export function ProfileClient() {
  const { user, reload, logout } = usePanelUser()
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await apiPut<{ user: PanelUser }>('/api/v1/users/profile', {
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'به‌روزرسانی ناموفق بود')
      return
    }
    await reload()
    setEditing(false)
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('fa-IR')
  const kycDone = user.kycLevel !== 'LEVEL_0'

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader
        title="پروفایل"
        description="اطلاعات شخصی و مدیریت حساب"
        actions={
          !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              ویرایش
            </Button>
          )
        }
      />

      {/* ============ Identity Header — سطح ممتاز ============ */}
      <section
        aria-label="هویت حساب"
        className="surface-wealth gold-rings relative overflow-hidden rounded-2xl border p-6"
      >
        <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="from-gold-500/30 to-gold-600/15 text-gold-300 ring-gold-500/40 shadow-gold flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-xl font-extrabold ring-1 sm:size-20 sm:text-2xl">
            {([user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile).slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-cream-50 truncate text-lg font-bold sm:text-xl">
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'کاربر زرسی'}
            </p>
            <p className="text-navy-200/70 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span dir="ltr" className="tabular-nums">
                {user.mobile}
              </span>
              <span aria-hidden="true">·</span>
              <span>عضویت از {joinDate}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={user.status === 'ACTIVE' ? 'success' : 'error'}>
                {user.status === 'ACTIVE' ? 'حساب فعال' : user.status}
              </StatusBadge>
              <StatusBadge tone={kycDone ? 'success' : 'warning'}>
                {KYC_LABELS[user.kycLevel] ?? user.kycLevel}
              </StatusBadge>
              {user.mobileVerifiedAt && (
                <StatusBadge tone="neutral" dot={false}>
                  موبایل تایید شده
                </StatusBadge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* اطلاعات حساب */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="text-gold-500 size-5" strokeWidth={1.75} />
              اطلاعات حساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={save} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pf-first"
                      className="text-foreground mb-1.5 block text-sm font-medium"
                    >
                      نام
                    </label>
                    <Input
                      id="pf-first"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      maxLength={64}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pf-last"
                      className="text-foreground mb-1.5 block text-sm font-medium"
                    >
                      نام خانوادگی
                    </label>
                    <Input
                      id="pf-last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      maxLength={64}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="pf-email"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    ایمیل (اختیاری)
                  </label>
                  <Input
                    id="pf-email"
                    type="email"
                    dir="ltr"
                    className="text-left"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && (
                  <p role="alert" className="bg-error/10 text-error rounded-lg px-3 py-2 text-sm">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" variant="gold" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? 'در حال ذخیره…' : 'ذخیره'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    انصراف
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="divide-border/40 divide-y text-sm">
                {[
                  ['نام', user.firstName ?? '—'],
                  ['نام خانوادگی', user.lastName ?? '—'],
                  ['شماره موبایل', user.mobile],
                  ['ایمیل', user.email ?? '—'],
                  ['تاریخ عضویت', joinDate],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      {label === 'شماره موبایل' && <Smartphone className="size-4" />}
                      {label === 'ایمیل' && <Mail className="size-4" />}
                      {label}
                    </dt>
                    <dd
                      className="text-foreground font-medium"
                      dir={label === 'ایمیل' || label === 'شماره موبایل' ? 'ltr' : undefined}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* وضعیت حساب */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">وضعیت حساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">وضعیت حساب</span>
              <StatusBadge tone={user.status === 'ACTIVE' ? 'success' : 'error'}>
                {user.status === 'ACTIVE' ? 'فعال' : user.status}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">سطح احراز هویت</span>
              <StatusBadge tone={kycDone ? 'success' : 'warning'}>
                {KYC_LABELS[user.kycLevel] ?? user.kycLevel}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">تایید موبایل</span>
              <StatusBadge tone={user.mobileVerifiedAt ? 'success' : 'warning'}>
                {user.mobileVerifiedAt ? 'تایید شده' : 'تایید نشده'}
              </StatusBadge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بخش‌های فرعی پروفایل — hub */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROFILE_SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="border-border/60 bg-card hover:border-gold-500/40 group flex items-center gap-3.5 rounded-xl border p-4 transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className="bg-gold-500/12 text-gold-600 dark:text-gold-400 flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-105">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-foreground block text-sm font-semibold">{title}</span>
              <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                {description}
              </span>
            </span>
            <ArrowLeft className="text-muted-foreground group-hover:text-gold-500 size-4 shrink-0 transition-colors" />
          </Link>
        ))}
        {/* Legal */}
        <div className="border-border/60 bg-muted/30 flex items-center gap-3.5 rounded-xl border border-dashed p-4 sm:col-span-2 lg:col-span-1">
          <span className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
            <FileText className="size-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-foreground block text-sm font-semibold">قوانین و مقررات</span>
            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-gold-600 dark:text-gold-400 text-xs hover:underline"
                >
                  {l.label}
                </Link>
              ))}
            </span>
          </span>
        </div>
      </div>

      {/* خروج از حساب — در موبایل تنها راه خروج است (sidebar مخفی است) */}
      <div className="border-border/60 flex items-center justify-between rounded-xl border p-4">
        <p className="text-muted-foreground text-xs leading-5">
          با خروج، نشست فعلی این دستگاه لغو می‌شود.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void logout()}
          className="text-error border-error/30 hover:bg-error/10 hover:text-error shrink-0"
        >
          <LogOut className="size-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  )
}
