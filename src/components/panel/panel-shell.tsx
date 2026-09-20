// ============================================
// Zar30 - User Panel Shell (Phase 3.1)
// ============================================
// Auth gate + navigation chrome برای همه صفحات /dashboard/*
// Desktop: Premium navy sidebar — Mobile: bottom nav (۵ آیتم قرارداد)
// Source of Truth ناوبری: src/config/navigation.ts (PANEL_NAV_ITEMS)
// ============================================

'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, LogOut } from 'lucide-react'
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

// ---- اسکلت بارگذاری — شکل کلی shell را تقلید می‌کند ----
function PanelLoadingSkeleton() {
  return (
    <div className="bg-background min-h-dvh" aria-busy="true" aria-label="در حال بارگذاری پنل">
      {/* Sidebar skeleton — desktop */}
      <div className="bg-navy-950 fixed inset-y-0 right-0 z-30 hidden w-64 flex-col p-4 md:flex">
        <div className="skeleton-shimmer mb-8 h-8 w-28 rounded-lg" />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-11 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Header skeleton — mobile */}
      <div className="border-border/60 bg-card sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <div className="skeleton-shimmer h-7 w-20 rounded-lg" />
        <div className="skeleton-shimmer size-9 rounded-xl" />
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-6xl p-4 py-6 md:pr-72 lg:pr-80">
        <div className="skeleton-shimmer mb-2 h-7 w-44 rounded-lg" />
        <div className="skeleton-shimmer mb-6 h-4 w-32 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Bottom nav skeleton — mobile */}
      <div className="bg-card border-border/60 fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
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

  return (
    <PanelContext.Provider value={{ user, reload: load, logout }}>
      <div className="bg-background min-h-dvh">
        {/* ============ Desktop — Premium Navy Sidebar ============ */}
        <aside className="bg-navy-950 fixed inset-y-0 right-0 z-30 hidden w-64 flex-col md:flex">
          {/* لوگو */}
          <div className="border-navy-700/50 flex h-16 items-center border-b px-5">
            <Link href="/" aria-label="زرسی — صفحه اصلی">
              <Logo size="md" textClassName="text-cream-100" />
            </Link>
          </div>

          {/* Navigation — از Source of Truth مرکزی */}
          <nav aria-label="ناوبری اصلی پنل" className="flex-1 space-y-1.5 overflow-y-auto p-4">
            {PANEL_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item, pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  title={item.description}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-(--duration-normal) ease-(--ease-out)',
                    'focus-visible:ring-gold-500/60 focus-visible:ring-2 focus-visible:outline-none',
                    active
                      ? 'bg-gold-500/12 text-gold-400 font-semibold'
                      : 'text-navy-200/70 hover:bg-navy-800/70 hover:text-cream-100',
                  )}
                >
                  {/* نشانگر active — نوار طلایی سمت راست (شروع RTL) */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'bg-gold-500 absolute top-1/2 right-0 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-(--duration-normal)',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30',
                    )}
                  />
                  <Icon
                    className={cn(
                      'size-5 shrink-0 transition-transform duration-(--duration-normal)',
                      active && 'scale-105',
                    )}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* بخش کاربر + خروج */}
          <div className="border-navy-700/50 border-t p-4">
            <div className="bg-navy-900/80 mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="bg-gold-500/15 text-gold-400 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {displayName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-cream-100 truncate text-xs font-medium" title={displayName}>
                  {displayName}
                </p>
                <p className="text-navy-300/60 truncate text-[10px]" dir="ltr">
                  {user.mobile}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-navy-200/60 hover:bg-error/10 hover:text-error focus-visible:ring-error/40 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              خروج از حساب
            </button>
          </div>
        </aside>

        {/* ============ Header — موبایل + دسکتاپ ============ */}
        <header className="border-border/60 bg-card/80 sticky top-0 z-(--z-sticky) flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm md:pr-68 md:pl-8">
          <Link href="/" className="md:hidden" aria-label="زرسی — صفحه اصلی">
            <Logo size="sm" />
          </Link>
          {/* دسکتاپ — سمت راست header فضای خالی برای breadcrumb آینده */}
          <div className="hidden md:block" />
          <div className="flex items-center gap-1.5">
            <NotificationBell />
          </div>
        </header>

        {/* ============ Content ============ */}
        <main className="pb-24 md:pr-64 md:pb-8">
          <div className="animate-fade-in mx-auto max-w-6xl p-4 py-6 sm:px-6">{children}</div>
        </main>

        {/* ============ Mobile — Bottom Navigation (۵ آیتم قرارداد) ============ */}
        <nav
          aria-label="ناوبری اصلی موبایل"
          className="bg-card/95 border-border/60 fixed inset-x-0 bottom-0 z-(--z-sticky) grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
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
                  'flex min-h-[60px] flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors duration-(--duration-fast)',
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
