// ============================================
// Zar30 - User Panel Shell (Full Panel Redesign)
// ============================================
// Auth gate + navigation chrome برای همه صفحات /dashboard/*
// Desktop: Premium navy sidebar — Mobile: bottom nav (۵ آیتم قرارداد)
// Source of Truth ناوبری: src/config/navigation.ts (PANEL_NAV_ITEMS)
// ============================================

'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, ChevronLeft, LogOut } from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { Logo } from '@/components/shared/logo'
import { PANEL_NAV_ITEMS, isNavItemActive, UTILITY_ROUTES } from '@/config/navigation'
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
      <div className="bg-navy-950 border-navy-700/40 fixed inset-y-0 right-0 left-auto z-30 hidden w-64 flex-col border-l md:flex">
        <div className="border-navy-700/40 flex h-16 items-center border-b px-5">
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
      <div className="border-border/60 bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md md:pr-68 md:pl-8">
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
      {/* Bottom nav skeleton — mobile */}
      <div className="bg-card/95 border-border/60 fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            <div className="skeleton-shimmer size-6 rounded-lg" />
          </div>
        ))}
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
      className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring relative flex size-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2"
    >
      <Bell className="size-5" strokeWidth={1.75} />
    </Link>
  )
}

// ---- آواتار کاربر — حروف اول نام روی halo طلایی ----
function UserAvatar({ user, size = 'md' }: { user: PanelUser; size?: 'sm' | 'md' }) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile
  const cls = size === 'sm' ? 'size-9 text-[11px]' : 'size-10 text-xs'
  return (
    <Link
      href="/dashboard/profile"
      aria-label="پروفایل کاربر"
      title={displayName}
      className={cn(
        'from-gold-500/25 to-gold-600/15 text-gold-300 ring-gold-500/30 hover:ring-gold-400/60 hover:shadow-gold flex shrink-0 items-center justify-center rounded-full bg-gradient-to-bl font-bold ring-1 transition-all duration-(--duration-normal) focus-visible:ring-2',
        cls,
      )}
    >
      {displayName.slice(0, 2)}
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
        {/* ============ Desktop — Premium Navy Sidebar ============ */}
        <aside className="bg-navy-950 border-navy-700/40 fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l md:flex">
          {/* لوگو */}
          <div className="border-navy-700/40 flex h-16 items-center border-b px-5">
            <Link href="/" aria-label="زرسی — صفحه اصلی">
              <Logo size="md" textClassName="text-cream-100" />
            </Link>
          </div>

          {/* Navigation — از Source of Truth مرکزی */}
          <nav aria-label="ناوبری اصلی پنل" className="flex-1 overflow-y-auto px-4 py-5">
            <p className="text-navy-300/50 mb-3 px-2 text-[10px] font-semibold">پنل کاربری</p>
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
                          ? 'from-gold-500/15 to-gold-500/5 text-gold-300 bg-gradient-to-l font-semibold shadow-sm'
                          : 'text-navy-200/70 hover:bg-navy-800/70 hover:text-cream-100',
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
          <div className="border-navy-700/40 space-y-2 border-t p-4">
            <Link
              href="/dashboard/profile"
              className="group bg-navy-900/80 hover:bg-navy-800/80 border-navy-700/30 hover:border-gold-500/30 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-(--duration-normal)"
            >
              <span className="from-gold-500/25 to-gold-600/15 text-gold-300 ring-gold-500/30 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-xs font-bold ring-1">
                {displayName.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-cream-100 block truncate text-xs font-medium">
                  {displayName}
                </span>
                <span
                  className="text-navy-300/60 block truncate text-[10px] tabular-nums"
                  dir="ltr"
                >
                  {user.mobile}
                </span>
              </span>
              <ChevronLeft className="text-navy-300/50 group-hover:text-gold-400 size-4 shrink-0 transition-colors" />
            </Link>
            <button
              onClick={logout}
              className="text-navy-200/60 hover:bg-error/10 hover:text-error focus-visible:ring-error/40 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              خروج از حساب
            </button>
          </div>
        </aside>

        {/* ============ Header — context-aware ============ */}
        <header className="border-border/60 bg-background/80 sticky top-0 z-(--z-sticky) flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-md md:pr-68 md:pl-8">
          <Link href="/" className="md:hidden" aria-label="زرسی — صفحه اصلی">
            <Logo size="sm" />
          </Link>
          {/* دسکتاپ — عنوان صفحه + تاریخ امروز */}
          <div className="hidden min-w-0 md:block">
            <p className="text-foreground truncate text-sm font-bold">{pageTitle(pathname)}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">{today}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <UserAvatar user={user} size="sm" />
          </div>
        </header>

        {/* ============ Content ============ */}
        <main className="pb-24 md:pr-64 md:pb-8">
          <div key={pathname} className="animate-page-in mx-auto max-w-6xl p-4 py-6 sm:px-6">
            {children}
          </div>
        </main>

        {/* ============ Mobile — Bottom Navigation (۵ آیتم قرارداد) ============ */}
        <nav
          aria-label="ناوبری اصلی موبایل"
          className="bg-card/95 border-border/60 fixed inset-x-0 bottom-0 z-(--z-sticky) grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.5)] backdrop-blur-md md:hidden"
        >
          {PANEL_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item, pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'flex min-h-[62px] flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors duration-(--duration-fast)',
                  'focus-visible:bg-muted focus-visible:outline-none',
                  active
                    ? 'text-gold-600 dark:text-gold-400 font-semibold'
                    : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'relative flex items-center justify-center rounded-xl px-3 py-1 transition-all duration-(--duration-normal) ease-(--ease-spring)',
                    active && 'bg-gold-500/12 animate-nav-pop',
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </PanelContext.Provider>
  )
}
