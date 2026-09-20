// ============================================
// Zar30 - Admin Shell (مرکز عملیات)
// ============================================
// Auth/permission gate + chrome ناوبری برای همه صفحات /admin/*
// Desktop (>=xl): سایدبار ثابت ۲۸۸px گروه‌بندی‌شده — Mobile/Tablet: header + drawer
// Source of Truth ناوبری: src/config/admin-navigation.ts — هر دو viewport از آن
// ============================================

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LogOut, Menu, ShieldX, X } from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type { Permission } from '@/lib/auth/rbac'
import { Logo } from '@/components/shared/logo'
import {
  ADMIN_NAV_SECTIONS,
  canSeeAdminItem,
  getAdminBreadcrumbs,
  isAdminNavItemActive,
  type AdminNavItem,
} from '@/config/admin-navigation'
import { AdminCommand } from '@/components/admin/admin-command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from 'cn'

// ============================================
// Admin Context
// ============================================

export interface AdminIdentity {
  id: string
  userId: string
  role: string
  permissions: readonly Permission[]
  firstName: string | null
  lastName: string | null
  mobile: string
}

interface AdminContextValue {
  admin: AdminIdentity
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin باید داخل AdminShell استفاده شود')
  return ctx
}

// برچسب فارسی نقش‌ها — فقط نمایشی؛ enforce همیشه سمت API است
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'مدیر ارشد',
  FINANCE: 'مالی',
  SUPPORT: 'پشتیبانی',
  KYC: 'احراز هویت',
  RISK: 'ریسک',
  CONTENT: 'محتوا',
  OPERATIONS: 'عملیات',
  ANALYST: 'تحلیلگر',
  READ_ONLY: 'فقط‌خواندنی',
}

// ============================================
// Navigation (مشترک بین sidebar و drawer)
// ============================================

function AdminNav({
  permissions,
  pathname,
  onNavigate,
}: {
  permissions: readonly Permission[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="ناوبری مرکز عملیات" className="flex-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV_SECTIONS.map((section) => {
        const visible = section.items.filter((item) => canSeeAdminItem(item, permissions))
        if (visible.length === 0) return null
        return (
          <div key={section.key} className="mb-5 last:mb-0">
            <p className="text-navy-300/50 mb-1.5 px-2 text-[10px] font-semibold">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {visible.map((item) => (
                <AdminNavLink
                  key={item.key}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function AdminNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isAdminNavItemActive(item, pathname)
  const Icon = item.icon
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        title={item.description}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors duration-(--duration-normal)',
          'focus-visible:ring-gold-500/60 focus-visible:ring-2 focus-visible:outline-none',
          active
            ? 'bg-gold-500/12 text-gold-300 font-semibold'
            : 'text-navy-200/70 hover:bg-navy-800/70 hover:text-cream-100',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-gold-500 absolute top-1/2 right-0 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity duration-(--duration-normal)',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30',
          )}
        />
        <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2 : 1.75} />
        {item.label}
      </Link>
    </li>
  )
}

// ============================================
// Admin identity block
// ============================================

function AdminIdentityBlock({ admin }: { admin: AdminIdentity }) {
  const displayName = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.mobile
  return (
    <div className="bg-navy-900/80 border-navy-700/30 flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <span
        aria-hidden="true"
        className="from-gold-500/25 to-gold-600/15 text-gold-300 ring-gold-500/30 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-xs font-bold ring-1"
      >
        {displayName.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-cream-100 block truncate text-xs font-medium">{displayName}</span>
        <span className="text-navy-300/60 block truncate text-[10px]">
          {ROLE_LABELS[admin.role] ?? admin.role}
        </span>
      </span>
    </div>
  )
}

// ============================================
// Loading / Denied states
// ============================================

function AdminLoadingSkeleton() {
  return (
    <div
      className="bg-background min-h-dvh"
      aria-busy="true"
      aria-label="در حال بارگذاری مرکز عملیات"
    >
      <div className="bg-navy-950 border-navy-700/40 fixed inset-y-0 right-0 left-auto z-30 hidden w-72 flex-col border-l xl:flex">
        <div className="border-navy-700/40 flex h-16 items-center border-b px-5">
          <div className="skeleton-shimmer h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="border-border/60 bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md xl:pr-76 xl:pl-8">
        <div className="skeleton-shimmer h-7 w-24 rounded-lg" />
        <div className="skeleton-shimmer h-9 w-40 rounded-lg" />
      </div>
      <div className="p-4 py-6 sm:px-6 xl:pr-80">
        <div className="skeleton-shimmer mb-5 h-40 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminPermissionDenied() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-6">
      <div className="bg-card border-border/60 w-full max-w-sm rounded-2xl border p-8 text-center shadow-sm">
        <span className="bg-error/10 text-error mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <ShieldX className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="text-foreground text-lg font-bold">دسترسی مجاز نیست</h1>
        <p className="text-muted-foreground mt-2 text-xs leading-6">
          حساب شما دسترسی مرکز عملیات را ندارد یا سطح دسترسی لازم را ندارید.
        </p>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          بازگشت به پنل کاربری
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

// ============================================
// Shell
// ============================================

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminIdentity | null>(null)
  const [denied, setDenied] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ admin: AdminIdentity }>('/api/v1/admin/me')
      if (cancelled) return
      if (!res.ok) {
        if (res.status === 403) {
          // کاربر احرازشده ولی ادمین نیست — نه login loop
          setDenied(true)
          return
        }
        const callback = encodeURIComponent(pathname)
        router.push(`/login?callbackUrl=${callback}`)
        return
      }
      setAdmin(res.data!.admin)
    })()
    return () => {
      cancelled = true
    }
  }, [router, pathname])

  async function logout() {
    await apiPost('/api/v1/auth/logout')
    router.push('/login')
    router.refresh()
  }

  if (denied) return <AdminPermissionDenied />
  if (!admin) return <AdminLoadingSkeleton />

  const breadcrumbs = getAdminBreadcrumbs(pathname)

  return (
    <AdminContext.Provider value={{ admin, logout }}>
      <div className="bg-background min-h-dvh">
        {/* ============ Desktop — Sidebar ثابت ۲۸۸px ============ */}
        <aside className="bg-navy-950 border-navy-700/40 fixed inset-y-0 right-0 z-30 hidden w-72 flex-col border-l xl:flex">
          <div className="border-navy-700/40 flex h-16 items-center justify-between border-b px-5">
            <Link href="/admin/dashboard" aria-label="مرکز عملیات — داشبورد">
              <Logo size="sm" textClassName="text-cream-100" />
            </Link>
            <span className="text-navy-300/60 text-[10px] font-semibold">مرکز عملیات</span>
          </div>
          <AdminNav permissions={admin.permissions} pathname={pathname} />
          <div className="border-navy-700/40 space-y-2 border-t p-4">
            <AdminIdentityBlock admin={admin} />
            <button
              type="button"
              onClick={logout}
              className="text-navy-200/60 hover:bg-error/10 hover:text-error focus-visible:ring-error/40 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              خروج از حساب
            </button>
          </div>
        </aside>

        {/* ============ Header ============ */}
        <header className="border-border/60 bg-background/80 sticky top-0 z-(--z-sticky) flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md xl:pr-80 xl:pl-8">
          {/* موبایل/تبلت — دکمه منو */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="باز کردن ناوبری مرکز عملیات"
            aria-expanded={navOpen}
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none xl:hidden"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>

          {/* Breadcrumbs — semantic */}
          <nav aria-label="مسیر راهنما" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-xs">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && (
                    <ChevronLeft
                      className="text-muted-foreground/60 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {crumb.href && i < breadcrumbs.length - 1 ? (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground truncate transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
                      className={cn(
                        'truncate',
                        i === breadcrumbs.length - 1
                          ? 'text-foreground font-semibold'
                          : 'text-muted-foreground',
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <AdminCommand />
          <span className="border-border/60 hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] sm:flex">
            <span className="text-muted-foreground">{ROLE_LABELS[admin.role] ?? admin.role}</span>
          </span>
        </header>

        {/* ============ Content ============ */}
        <main className="pb-24 xl:pr-72 xl:pb-8">
          <div key={pathname} className="animate-page-in mx-auto max-w-[1400px] p-4 py-6 sm:px-6">
            {children}
          </div>
        </main>

        {/* ============ Mobile/Tablet — Drawer ناوبری از سمت راست ============ */}
        <Dialog open={navOpen} onOpenChange={setNavOpen}>
          <DialogContent
            showCloseButton={false}
            className="bg-navy-950 border-navy-700/40 top-0 right-0 left-auto flex h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l p-0"
          >
            <DialogTitle className="sr-only">ناوبری مرکز عملیات</DialogTitle>
            <DialogDescription className="sr-only">
              دسترسی به بخش‌های مرکز عملیات بر اساس سطح دسترسی شما
            </DialogDescription>
            <div className="border-navy-700/40 flex h-16 shrink-0 items-center justify-between border-b px-5">
              <Link
                href="/admin/dashboard"
                onClick={() => setNavOpen(false)}
                aria-label="مرکز عملیات — داشبورد"
              >
                <Logo size="sm" textClassName="text-cream-100" />
              </Link>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="بستن ناوبری"
                className="text-navy-200/70 hover:bg-navy-800/70 hover:text-cream-100 flex size-9 items-center justify-center rounded-lg transition-colors"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <AdminNav
              permissions={admin.permissions}
              pathname={pathname}
              onNavigate={() => setNavOpen(false)}
            />
            <div className="border-navy-700/40 shrink-0 space-y-2 border-t p-4">
              <AdminIdentityBlock admin={admin} />
              <button
                type="button"
                onClick={logout}
                className="text-navy-200/60 hover:bg-error/10 hover:text-error focus-visible:ring-error/40 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                خروج از حساب
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminContext.Provider>
  )
}
