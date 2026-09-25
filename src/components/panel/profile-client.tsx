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
  IconArrowLeft,
  IconRosetteDiscountCheck,
  IconBell,
  IconBellRinging,
  IconBolt,
  IconCalendarClock,
  IconCoins,
  IconFileText,
  IconGift,
  IconLifebuoy,
  IconLogout,
  IconDevices,
  IconDeviceFloppy,
  IconPackage,
  IconShieldCheck,
  IconPencil,
  IconPigMoney,
  IconSparkles,
  IconUser,
} from '@tabler/icons-react'
import { apiPut } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { usePanelUser, type PanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// خدمات بیشتر — گرید ۴تایی مربعی عین میان‌برهای صفحه خانه
const MORE_SERVICES = [
  { label: 'خرید خودکار', href: '/dashboard/profile/savings', icon: IconPigMoney },
  { label: 'اعتبار فوری', href: '/dashboard/installments', icon: IconBolt },
  { label: 'زرکار', href: '/dashboard/zarkar', icon: IconSparkles },
  { label: 'تحویل فیزیکی', href: '/dashboard/delivery', icon: IconPackage },
  { label: 'سکه و شمش', href: '/dashboard/delivery', icon: IconCoins },
  { label: 'خرید قسطی', href: '/dashboard/installments', icon: IconCalendarClock },
  { label: 'هشدار قیمت', href: '/dashboard/trade', icon: IconBellRinging },
  { label: 'معرفی دوستان', href: '/dashboard/profile/referral', icon: IconGift },
] as const

// تنظیمات — ردیف‌های زیر هم
const SETTINGS_ITEMS = [
  {
    href: '/dashboard/profile/kyc',
    icon: IconRosetteDiscountCheck,
    title: 'احراز هویت',
    description: 'تایید هویت و ارتقای سطح حساب',
  },
  {
    href: '/dashboard/profile/security',
    icon: IconShieldCheck,
    title: 'امنیت و رمز عبور',
    description: 'رمز عبور، ۲FA و رویدادهای امنیتی',
  },
  {
    href: '/dashboard/profile/sessions',
    icon: IconDevices,
    title: 'دستگاه‌ها و نشست‌ها',
    description: 'دستگاه‌های متصل و مدیریت نشست‌ها',
  },
  {
    href: '/dashboard/notifications',
    icon: IconBell,
    title: 'اعلان‌ها',
    description: 'مرکز اعلان و تنظیمات اطلاع‌رسانی',
  },
  {
    href: '/dashboard/profile/support',
    icon: IconLifebuoy,
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

  return (
    <div className="animate-stagger space-y-5">
      {/* ============ Identity Header — سطح ممتاز ============ */}
      <section
        aria-label="هویت حساب"
        className="surface-wealth gold-rings relative overflow-hidden rounded-2xl border p-6"
      >
        {/* ویرایش — آیکون مداد گوشه بالا چپ */}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="ویرایش پروفایل"
            className="text-cream-300/70 hover:bg-cream-50/10 hover:text-cream-50 absolute top-4 left-4 z-10 flex size-9 items-center justify-center rounded-xl transition-colors"
          >
            <IconPencil className="size-4.5" stroke={1.75} />
          </button>
        )}
        <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="from-gold-400 to-gold-600 text-navy-950 ring-gold-300/50 shadow-gold flex size-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-bl ring-1 sm:size-20">
            <IconUser className="size-8 sm:size-9" stroke={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-cream-50 truncate text-lg font-bold sm:text-xl">
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'کاربر زرسی'}
            </p>
            <p className="text-cream-300/60 mt-1 flex items-baseline gap-x-2.5 text-xs whitespace-nowrap">
              <span className="tabular-nums">{toPersianDigits(user.mobile)}</span>
              <span aria-hidden="true">·</span>
              <span>عضویت از {joinDate}</span>
            </p>
          </div>
        </div>
      </section>

      {/* اطلاعات حساب — فقط در حالت ویرایش (آیکون مداد) باز می‌شود */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconUser className="text-gold-600 size-5" stroke={1.75} />
              اطلاعات حساب
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Button type="submit" variant="default" disabled={saving}>
                  <IconDeviceFloppy className="size-4" />
                  {saving ? 'در حال ذخیره…' : 'ذخیره'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ============ خدمات بیشتر — گرید ۴تایی مربعی عین صفحه خانه ============ */}
      <section aria-label="خدمات بیشتر">
        <p className="text-muted-foreground mb-2.5 px-1 text-xs font-semibold">خدمات بیشتر</p>
        <div className="grid grid-cols-4 gap-3">
          {MORE_SERVICES.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="border-border/60 bg-card hover:border-gold-500/40 focus-visible:ring-ring flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border transition-all duration-(--duration-normal) hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <s.icon className="text-gold-600 size-6 sm:size-7" stroke={1.5} />
              <span className="text-foreground px-1 text-center text-[10px] font-medium sm:text-xs">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ تنظیمات — ردیف‌های زیر هم ============ */}
      <section aria-label="تنظیمات">
        <p className="text-muted-foreground mb-2.5 px-1 text-xs font-semibold">تنظیمات</p>
        <div className="border-border/60 bg-card divide-border/50 divide-y overflow-hidden rounded-2xl border">
          {SETTINGS_ITEMS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="hover:bg-muted/40 group flex items-center gap-3.5 p-4 transition-colors"
            >
              <Icon
                className="text-gold-600 dark:text-gold-400 size-6 shrink-0"
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1">
                <span className="text-foreground block text-sm font-semibold">{title}</span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {description}
                </span>
              </span>
              <IconArrowLeft className="text-muted-foreground group-hover:text-gold-600 size-4 shrink-0 transition-colors" />
            </Link>
          ))}
          {/* قوانین و مقررات */}
          <div className="flex items-center gap-3.5 p-4">
            <IconFileText className="text-muted-foreground size-6 shrink-0" stroke={1.75} />
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
      </section>

      {/* خروج از حساب — در موبایل تنها راه خروج است (sidebar مخفی است) */}
      <div className="border-border/60 flex items-center justify-between rounded-xl border p-4">
        <p className="text-muted-foreground min-w-0 text-[11px] whitespace-nowrap tabular-nums">
          زرسی — ۱۴۰۵ · نسخه ۰.۱.۰
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void logout()}
          className="text-error border-error/30 hover:bg-error/10 hover:text-error shrink-0"
        >
          <IconLogout className="size-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  )
}
