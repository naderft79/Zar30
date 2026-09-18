// ============================================
// Zarnama - User Panel Shell (Phase 3)
// ============================================
// Auth gate + navigation chrome برای همه صفحات /dashboard/*
// Desktop: sidebar — Mobile: bottom navigation
// ============================================

'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { Logo } from '@/components/shared/logo'
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
}

const PanelContext = createContext<PanelContextValue | null>(null)

export function usePanelUser(): PanelContextValue {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanelUser باید داخل PanelShell استفاده شود')
  return ctx
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'پروفایل', icon: User },
  { href: '/dashboard/security', label: 'امنیت', icon: ShieldCheck },
  { href: '/dashboard/sessions', label: 'نشست‌ها', icon: MonitorSmartphone },
  { href: '/dashboard/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/referral', label: 'معرفی دوستان', icon: Gift },
  { href: '/dashboard/support', label: 'پشتیبانی', icon: LifeBuoy },
] as const

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

  if (!user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">در حال بارگذاری…</p>
      </div>
    )
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile

  return (
    <PanelContext.Provider value={{ user, reload: load }}>
      <div className="bg-background min-h-screen">
        {/* Sidebar — desktop */}
        <aside className="border-border/60 bg-card/50 fixed inset-y-0 right-0 z-30 hidden w-60 flex-col border-l md:flex">
          <div className="border-border/60 flex h-16 items-center border-b px-5">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-gold/15 text-gold font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="border-border/60 border-t p-3">
            <div className="mb-2 truncate px-3 text-sm font-medium" title={displayName}>
              {displayName}
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            >
              <LogOut className="size-5" />
              خروج از حساب
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="border-border/60 bg-card/50 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <button
            onClick={logout}
            aria-label="خروج از حساب"
            className="text-muted-foreground hover:text-destructive p-2"
          >
            <LogOut className="size-5" />
          </button>
        </header>

        {/* Content — desktop: فضای sidebar در سمت راست خالی می‌ماند */}
        <main className="pb-20 md:pr-60 md:pb-0">
          <div className="mx-auto max-w-5xl p-4 py-6 sm:px-6">{children}</div>
        </main>

        {/* Bottom nav — mobile */}
        <nav className="border-border/60 bg-card fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t md:hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-[10px]',
                  active ? 'text-gold' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </PanelContext.Provider>
  )
}
