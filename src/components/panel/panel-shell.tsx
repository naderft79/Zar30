// ============================================
// Zar30 - User Panel Shell (Luxury Redesign)
// ============================================
// Auth gate + navigation chrome برای همه صفحات /dashboard/*
// Desktop: sidebar گرافیت لوکس — Mobile: floating bottom nav (۵ آیتم قرارداد)
// Source of Truth ناوبری: src/config/navigation.ts (PANEL_NAV_ITEMS)
// ============================================

'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconBell,
  IconChevronLeft,
  IconHelpCircle,
  IconHeadset,
  IconLogout,
  IconRefresh,
  IconUser,
} from '@tabler/icons-react'

import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { PANEL_NAV_ITEMS, isNavItemActive, UTILITY_ROUTES } from '@/config/navigation'
import { OfflineIndicator, DATA_REFRESH_EVENT } from './offline-indicator'
import { NativeNotificationBridge } from './native-notification-bridge'
import { cn } from 'cn'

export interface PanelUser {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  email: string | null
  avatarUrl: string | null
  kycLevel: string
  status: string
  referralCode: string
  referredById: string | null
  mobileVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

interface PanelContextValue {
  user: PanelUser
  reload: () => Promise<void>
  /** خروج از حساب — نشست جاری revoke و به /login هدایت می‌شود */
  logout: () => Promise<void>
}

const PanelContext = createContext<PanelContextValue | null>(null)

export function usePanelUser(): PanelContextValue {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelUser باید داخل PanelShell استفاده شود')
  return ctx
}

// عنوان context در Header دسکتاپ — از مسیر فعلی استخراج می‌شود
const PAGE_TITLES: Array<[prefix: string, title: string]> = [
  ['/dashboard/profile/security', 'مرکز امنیت'],
  ['/dashboard/profile/sessions', 'دستگاه‌ها و نشست‌ها'],
  ['/dashboard/profile/referral', 'معرفی دوستان'],
  ['/dashboard/profile/support', 'پشتیبانی'],
  ['/dashboard/profile', 'پروفایل'],
  ['/dashboard/notifications', 'اعلان‌ها'],
  ['/dashboard/trade', 'معاملات'],
  ['/dashboard/assets', 'دارایی'],
  ['/dashboard/installments', 'خرید قسطی'],
  ['/dashboard/deposit', 'واریز به کیف پول'],
  ['/dashboard/withdraw', 'درخواست برداشت'],
  ['/dashboard/transfer', 'انتقال به کاربر زرسی'],
  ['/dashboard/delivery', 'تحویل فیزیکی طلا'],
  ['/dashboard/zarkar', 'زرکار — سپرده طلا'],
  ['/dashboard/transactions', 'سوابق مالی'],
]

function pageTitle(pathname: string): string {
  for (const [prefix, title] of PAGE_TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title
  }
  return 'خانه'
}

// ---- اسکلت بارگذاری — شکل کلی shell جدید را تقلید می‌کند ----
function PanelLoadingSkeleton() {
  return (
    <div className="bg-background min-h-dvh" aria-busy="true" aria-label="در حال بارگذاری پنل">
      {/* Sidebar skeleton — desktop */}
      <div className="bg-surface border-border/60 fixed inset-y-0 right-0 left-auto z-30 hidden w-64 flex-col border-l md:flex">
        <div className="border-border/60 flex h-13 items-center border-b px-5">
          <div className="skeleton-shimmer h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-2 p-4">
          <div className="skeleton-shimmer mr-1 mb-1 h-3 w-16 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-11 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Header skeleton */}
      <div className="border-border/60 bg-background/70 sticky top-0 z-30 flex h-13 items-center justify-between border-b px-4 backdrop-blur-xl md:pr-68 md:pl-8">
        <div className="skeleton-shimmer h-7 w-24 rounded-lg md:hidden" />
        <div className="hidden md:block">
          <div className="skeleton-shimmer mb-1.5 h-5 w-28 rounded-lg" />
          <div className="skeleton-shimmer h-3 w-40 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer size-10 rounded-xl" />
          <div className="skeleton-shimmer size-9 rounded-full" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-6xl p-4 py-6 sm:px-6 md:pr-72">
        <div className="skeleton-shimmer mb-5 h-44 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Bottom nav skeleton — mobile — pill شناور */}
      <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
        <div className="bg-card/95 border-border/60 grid h-16 grid-cols-5 rounded-2xl border shadow-xl backdrop-blur-xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <div className="skeleton-shimmer size-6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Notification bell — اکشن ثانویه در header (nav item نیست) ----
function NotificationBell() {
  return (
    <Link
      href={UTILITY_ROUTES.notifications}
      aria-label="مرکز اعلان‌ها"
      className="text-muted-foreground hover:bg-muted hover:text-gold-600 focus-visible:ring-ring border-border/50 bg-card/60 relative flex size-9 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2"
    >
      <IconBell className="size-4.5" stroke={1.75} />
    </Link>
  )
}

// ---- اکشن دوم هدر: خانه→اعلان، پروفایل→پشتیبانی، بقیه→راهنما ----
function HeaderAction({ pathname }: { pathname: string }) {
  if (pathname === '/dashboard') return <NotificationBell />
  const isProfile = pathname.startsWith('/dashboard/profile')
  return (
    <Link
      href="/dashboard/support"
      aria-label={isProfile ? 'پشتیبانی' : 'راهنمای صفحه'}
      title={isProfile ? 'پشتیبانی' : 'راهنما'}
      className="text-muted-foreground hover:bg-muted hover:text-gold-600 focus-visible:ring-ring border-border/50 bg-card/60 relative flex size-9 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2"
    >
      {isProfile ? (
        <IconHeadset className="size-4.5" stroke={1.75} />
      ) : (
        <IconHelpCircle className="size-4.5" stroke={1.75} />
      )}
    </Link>
  )
}

// ---- آواتار کاربر — آیکون آدمک سورمه‌ای؛ دقیقاً همان‌سبک زنگوله اعلان ----
function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: PanelUser
  size?: 'sm' | 'md'
  className?: string
}) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile
  const cls = size === 'sm' ? 'size-9' : 'size-10'
  return (
    <Link
      href="/dashboard/profile"
      aria-label="پروفایل کاربر"
      title={displayName}
      className={cn(
        'text-cream-50 hover:bg-navy-600 focus-visible:ring-ring border-border/50 bg-navy-700 relative flex shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2',
        cls,
        className,
      )}
    >
      <IconUser className="size-4.5" stroke={1.75} aria-hidden="true" />
    </Link>
  )
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<PanelUser | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ user: PanelUser }>('/api/v1/users/me')
    if (!res.ok) {
      router.push('/login')
      return
    }
    setUser(res.data!.user)
  }, [router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ user: PanelUser }>('/api/v1/users/me')
      if (cancelled) return
      if (!res.ok) {
        router.push('/login')
        return
      }
      setUser(res.data!.user)
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  async function logout() {
    await apiPost('/api/v1/auth/logout')
    router.push('/login')
    router.refresh()
  }

  // ---- Pull-to-refresh موبایل — کشیدن صفحه از بالا به پایین → رفرش داده ----
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef<number | null>(null)

  function onPullStart(e: React.TouchEvent) {
    // لمسی که داخل dialog (BottomSheet) شروع شده pull را فعال نکند
    if ((e.target as HTMLElement).closest('[role="dialog"]')) return
    if (window.scrollY <= 0) pullStart.current = e.touches[0]!.clientY
  }
  function onPullMove(e: React.TouchEvent) {
    if (pullStart.current === null || refreshing) return
    const dy = e.touches[0]!.clientY - pullStart.current
    if (dy > 0 && window.scrollY <= 0) setPullY(Math.min(dy * 0.45, 96))
  }
  function onPullEnd() {
    if (pullStart.current === null) return
    pullStart.current = null
    if (pullY >= 64 && !refreshing) {
      if (!navigator.onLine) {
        // آفلاین — pull انجام نشود (بنر آفلاین خودش وضعیت را نشان می‌دهد)
        setPullY(0)
        return
      }
      setRefreshing(true)
      // صفحات به این event گوش می‌دهند و داده‌شان را رفرش می‌کنند
      window.dispatchEvent(new Event(DATA_REFRESH_EVENT))
      void load()
      setTimeout(() => setRefreshing(false), 700)
    }
    setPullY(0)
  }

  if (!user) return <PanelLoadingSkeleton />

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile
  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <PanelContext.Provider value={{ user, reload: load, logout }}>
      <div className="bg-background min-h-dvh">
        {/* پل اعلان native — فقط در APK فعال است */}
        <NativeNotificationBridge />

        {/* ============ Desktop — Sidebar گرافیت لوکس ============ */}
        <aside className="bg-surface border-border/60 fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l md:flex">
          {/* لوگو */}
          <div className="border-border/60 flex h-13 items-center border-b px-5">
            <Link href="/" aria-label="زرسی — صفحه اصلی">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-header.png" alt="زرسی" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Navigation — از Source of Truth مرکزی */}
          <nav aria-label="ناوبری اصلی پنل" className="flex-1 overflow-y-auto px-4 py-5">
            <p className="text-muted-foreground/60 mb-3 px-2 text-[10px] font-semibold">
              پنل کاربری
            </p>
            <ul className="space-y-1.5">
              {PANEL_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(item, pathname)
                const Icon = item.icon
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={item.description}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-(--duration-normal) ease-(--ease-out)',
                        'focus-visible:ring-gold-500/60 focus-visible:ring-2 focus-visible:outline-none',
                        active
                          ? 'from-gold-500/18 to-gold-500/5 text-gold-700 bg-gradient-to-l font-semibold shadow-sm'
                          : 'text-text-secondary/80 hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {/* نشانگر active — نوار طلایی سمت راست (شروع RTL) */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'bg-gold-500 shadow-gold absolute top-1/2 right-0 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-(--duration-normal)',
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30',
                        )}
                      />
                      <Icon
                        className={cn(
                          'size-5 shrink-0 transition-transform duration-(--duration-normal) ease-(--ease-spring)',
                          active && 'scale-105',
                          !active && 'group-hover:scale-105',
                        )}
                        strokeWidth={active ? 2 : 1.75}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* بخش کاربر + خروج */}
          <div className="border-border/60 space-y-2 border-t p-4">
            <Link
              href="/dashboard/profile"
              className="group bg-muted/60 hover:bg-muted border-border hover:border-gold-500/30 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-(--duration-normal)"
            >
              <IconUser
                className="text-gold-600 size-6 shrink-0"
                stroke={1.75}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-xs font-medium">
                  {displayName}
                </span>
                <span
                  className="text-muted-foreground/70 block truncate text-[10px] tabular-nums"
                  dir="ltr"
                >
                  {user.mobile}
                </span>
              </span>
              <IconChevronLeft className="text-muted-foreground/60 group-hover:text-gold-600 size-4 shrink-0 transition-colors" />
            </Link>
            <button
              onClick={logout}
              className="text-text-secondary/70 hover:bg-error/10 hover:text-error focus-visible:ring-error/40 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconLogout className="size-4" stroke={1.75} />
              خروج از حساب
            </button>
          </div>
        </aside>

        {/* ============ Header — شیشه‌ای فشرده + safe-area notch ============ */}
        <header className="border-border/40 bg-background/70 sticky top-0 z-(--z-sticky) grid h-[calc(3.25rem+env(safe-area-inset-top))] grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:px-6 md:pr-68 md:pl-8">
          {/* موبایل — آواتار پروفایل (سمت راست در RTL) */}
          <div className="flex items-center md:hidden">
            <UserAvatar user={user} size="sm" />
          </div>
          {/* دسکتاپ — عنوان صفحه + تاریخ امروز */}
          <div className="hidden min-w-0 items-baseline gap-2.5 md:flex">
            <p className="text-foreground truncate text-sm font-bold">{pageTitle(pathname)}</p>
            <p className="text-muted-foreground/70 shrink-0 text-[10px] tabular-nums">{today}</p>
          </div>
          {/* مرکز — مارک برند در خانه، عنوان صفحه در بقیه (فقط موبایل) */}
          {pathname === '/dashboard' ? (
            <Link href="/dashboard" aria-label="زرسی" className="justify-self-center md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-header.png" alt="زرسی" className="h-8 w-auto" />
            </Link>
          ) : (
            <p className="text-foreground justify-self-center truncate text-sm font-bold md:hidden">
              {pageTitle(pathname)}
            </p>
          )}
          <div className="hidden md:block" />
          <div className="flex items-center gap-1.5 justify-self-end">
            <HeaderAction pathname={pathname} />
            <UserAvatar user={user} size="sm" className="hidden md:flex" />
          </div>
        </header>

        {/* ============ Content + Pull-to-refresh ============ */}
        <OfflineIndicator />
        <main
          className="pb-28 md:pr-64 md:pb-8"
          onTouchStart={onPullStart}
          onTouchMove={onPullMove}
          onTouchEnd={onPullEnd}
        >
          {/* نشانگر pull — فلش طلایی که با کشیدن می‌چرخد */}
          {(pullY > 8 || refreshing) && (
            <div
              className="pointer-events-none flex justify-center transition-opacity"
              style={{ opacity: Math.min(1, pullY / 48) }}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'bg-card border-border/60 text-gold-600 mt-1 flex size-8 items-center justify-center rounded-full border shadow-md',
                  refreshing && 'animate-spin',
                )}
                style={{ transform: `rotate(${pullY * 3}deg)` }}
              >
                <IconRefresh className="size-4" stroke={2} />
              </span>
            </div>
          )}
          <div
            key={pathname}
            className="animate-page-in mx-auto max-w-6xl p-4 py-5 sm:px-6 sm:py-6"
          >
            {children}
          </div>
        </main>
        {/* ============ Mobile — Liquid Glass Bottom Nav (۵ آیتم قرارداد) ============ */}
        <nav
          aria-label="ناوبری اصلی موبایل"
          className="fixed inset-x-4 bottom-3 z-(--z-sticky) pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <div className="bg-navy-900/92 grid h-[68px] grid-cols-5 rounded-[1.75rem] shadow-[0_18px_48px_-12px_rgb(7_13_29/0.6),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-2xl">
            {PANEL_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item, pathname)
              const Icon = item.icon

              // معاملات — اکشن مرکزی برجسته: دایره طلایی بیرون‌زده از نوار
              if (item.key === 'trade') {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.label}
                    className="group flex min-h-[44px] flex-col items-center justify-end gap-0.5 pb-1.5 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        'from-gold-400 via-gold-500 to-gold-600 ring-gold-500/30 shadow-gold relative -mt-9 mb-1 flex size-14 items-center justify-center rounded-full bg-gradient-to-bl ring-4 transition-transform duration-(--duration-normal) ease-(--ease-spring) group-active:scale-95',
                        active && 'animate-nav-pop',
                      )}
                    >
                      {/* برق شیشه‌ای روی دایره */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1.5 top-1 h-4 rounded-full bg-white/35 blur-[3px]"
                      />
                      <Icon
                        className="size-6 text-[#171105]"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold transition-colors',
                        active ? 'text-gold-400' : 'text-cream-200/60',
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={cn(
                    'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition-colors duration-(--duration-fast)',
                    'focus-visible:bg-gold-500/10 focus-visible:outline-none',
                    active ? 'text-gold-400 font-semibold' : 'text-cream-200/55',
                  )}
                >
                  <span
                    className={cn(
                      'relative flex items-center justify-center rounded-xl px-3.5 py-1 transition-all duration-(--duration-normal) ease-(--ease-spring)',
                      active &&
                        'bg-gold-500/15 animate-nav-pop shadow-[0_0_16px_rgb(212_175_55/0.25)]',
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </PanelContext.Provider>
  )
}
