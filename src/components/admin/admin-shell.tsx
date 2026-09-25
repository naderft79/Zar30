// ============================================
// Zar30 - Admin Shell (مرکز عملیات)
// ============================================
// Auth/permission gate + chrome ناوبری برای همه صفحات /admin/*
// Desktop (>=xl): سایدبار جمع‌شونده (۲۸۸px ↔ ۷۶px) با آیکون بخش‌ها
// هویت مدیر و خروج در هدر اصلی — Mobile/Tablet: header + drawer
// Source of Truth ناوبری: src/config/admin-navigation.ts
// ============================================

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconChevronLeft,
  IconChevronsLeft,
  IconChevronsRight,
  IconLogout,
  IconMenu2,
  IconShieldX,
  IconX,
} from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type { Permission } from '@/lib/auth/rbac'
import { Logo } from '@/components/shared/logo'
import {
  ADMIN_NAV_SECTIONS,
  canSeeAdminItem,
  getAdminBreadcrumbs,
  isAdminNavItemActive,
  isAdminNavSectionActive,
  type AdminNavItem,
} from '@/config/admin-navigation'
import { AdminCommand } from '@/components/admin/admin-command'
import { AdminThemeToggle } from '@/components/admin/admin-theme-toggle'
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

// وضعیت جمع‌شدگی سایدبار بین reloadها حفظ می‌شود
const SIDEBAR_PREF_KEY = 'zar30-admin-sidebar-collapsed'

// ============================================
// Navigation (مشترک بین sidebar و drawer)
// ============================================

function AdminNav({
  permissions,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  permissions: readonly Permission[]
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  return (
    <nav
      aria-label="ناوبری مرکز عملیات"
      className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4"
    >
      {ADMIN_NAV_SECTIONS.map((section) => {
        const visible = section.items.filter((item) => canSeeAdminItem(item, permissions))
        if (visible.length === 0) return null
        const SectionIcon = section.icon
        const sectionActive = isAdminNavSectionActive(section, pathname)
        return (
          <div key={section.key} className="mb-5 last:mb-0">
            {/* سربرگ بخش — آیکون + عنوان */}
            <div
              className={cn(
                'mb-1.5 flex h-8 items-center gap-2 px-2',
                collapsed && 'justify-center px-0',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-(--duration-normal)',
                  sectionActive ? 'bg-gold-500/15 text-gold-700' : 'bg-muted text-muted-foreground',
                )}
              >
                <SectionIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p
                className={cn(
                  'text-muted-foreground truncate text-[10px] font-semibold tracking-wide transition-opacity duration-200',
                  collapsed ? 'pointer-events-none w-0 opacity-0' : 'opacity-100',
                )}
              >
                {section.label}
              </p>
            </div>
            <ul className="space-y-0.5">
              {visible.map((item) => (
                <AdminNavLink
                  key={item.key}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
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
  collapsed = false,
}: {
  item: AdminNavItem
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const active = isAdminNavItemActive(item, pathname)
  const Icon = item.icon
  return (
    <li className={cn(collapsed && 'flex justify-center')}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : item.description}
        className={cn(
          'group relative flex items-center rounded-lg text-[13px] transition-colors duration-(--duration-normal)',
          'focus-visible:ring-gold-500/60 focus-visible:ring-2 focus-visible:outline-none',
          collapsed ? 'size-10 justify-center' : 'gap-3 px-3 py-2.5',
          active
            ? 'bg-gold-500/12 text-gold-700 font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-gold-500 absolute top-1/2 right-0 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity duration-(--duration-normal)',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30',
          )}
        />
        <Icon
          className="size-[18px] shrink-0 transition-transform duration-(--duration-normal) group-hover:scale-[1.06]"
          strokeWidth={active ? 2 : 1.75}
        />
        <span
          className={cn(
            'truncate transition-opacity duration-200',
            collapsed ? 'pointer-events-none w-0 opacity-0' : 'opacity-100',
          )}
        >
          {item.label}
        </span>
      </Link>
    </li>
  )
}

// ============================================
// Header identity — هویت مدیر در هدر اصلی
// ============================================

function AdminHeaderIdentity({ admin, onLogout }: { admin: AdminIdentity; onLogout: () => void }) {
  const displayName = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.mobile
  return (
    <div className="border-border/60 bg-card/60 flex items-center gap-2 rounded-xl border py-1 pr-1 pl-1.5 sm:gap-2.5 sm:py-1.5 sm:pr-1.5 sm:pl-3">
      <span
        aria-hidden="true"
        className="from-gold-500/30 to-gold-600/20 text-gold-700 ring-gold-500/30 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-bl text-[11px] font-bold ring-1"
      >
        {displayName.slice(0, 2)}
      </span>
      <span className="hidden min-w-0 leading-tight sm:block">
        <span className="text-foreground block max-w-36 truncate text-xs font-semibold">
          {displayName}
        </span>
        <span className="text-muted-foreground block truncate text-[10px]">
          {ROLE_LABELS[admin.role] ?? admin.role}
        </span>
      </span>
      <button
        type="button"
        onClick={onLogout}
        aria-label="خروج از حساب"
        title="خروج از حساب"
        className="text-muted-foreground hover:bg-error/10 hover:text-error focus-visible:ring-error/40 ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconLogout className="size-4" stroke={1.75} />
      </button>
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
      <div className="border-border bg-card fixed inset-y-0 right-0 left-auto z-30 hidden w-72 flex-col border-l xl:flex">
        <div className="border-border flex h-16 items-center border-b px-5">
          <div className="skeleton-shimmer h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="border-border/60 bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md xl:pr-80 xl:pl-8">
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
        <IconShieldX className="text-error mx-auto mb-4 size-9" stroke={1.75} aria-hidden="true" />
        <h1 className="text-foreground text-lg font-bold">دسترسی مجاز نیست</h1>
        <p className="text-muted-foreground mt-2 text-xs leading-6">
          حساب شما دسترسی مرکز عملیات را ندارد یا سطح دسترسی لازم را ندارید.
        </p>
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          بازگشت به پنل کاربری
          <IconChevronLeft className="size-4" aria-hidden="true" />
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
  // ترجیح جمع‌شدگی — skeleton به collapsed وابسته نیست، پس mismatch نداریم
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_PREF_KEY) === 'collapsed',
  )

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(SIDEBAR_PREF_KEY, v ? 'expanded' : 'collapsed')
      return !v
    })
  }

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
        {/* ============ Desktop — Sidebar جمع‌شونده ============ */}
        <aside
          className={cn(
            'border-border bg-card fixed inset-y-0 right-0 z-40 hidden flex-col border-l xl:flex',
            'transition-[width] duration-300 ease-(--ease-out)',
            collapsed ? 'w-[76px]' : 'w-72',
          )}
        >
          {/* سربرگ سایدبار — لوگو + کلید جمع‌کردن */}
          <div
            className={cn(
              'border-border flex h-16 shrink-0 items-center border-b',
              collapsed ? 'justify-center px-2' : 'justify-between px-5',
            )}
          >
            <Link
              href="/admin/dashboard"
              aria-label="مرکز عملیات — داشبورد"
              className={cn('flex min-w-0 items-center', collapsed && 'w-0 overflow-hidden')}
            >
              <Logo size="sm" textClassName="text-foreground" />
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار'}
              aria-expanded={!collapsed}
              title={collapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار'}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-gold-500/60 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {collapsed ? (
                <IconChevronsLeft className="size-4" stroke={1.75} />
              ) : (
                <IconChevronsRight className="size-4" stroke={1.75} />
              )}
            </button>
          </div>

          {/* خط طلایی ظریف زیر سربرگ */}
          <div
            aria-hidden="true"
            className="from-gold-500/40 via-gold-500/10 h-px bg-gradient-to-l to-transparent"
          />

          <AdminNav permissions={admin.permissions} pathname={pathname} collapsed={collapsed} />

          {/* نسخه/برند پایین سایدبار — فشرده */}
          <div
            className={cn(
              'border-border shrink-0 border-t',
              collapsed
                ? 'flex justify-center py-3'
                : 'flex items-center justify-between px-5 py-3',
            )}
          >
            <span
              className={cn(
                'text-muted-foreground text-[10px] font-semibold',
                collapsed && 'hidden',
              )}
            >
              مرکز عملیات زرسی
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'bg-gold-500/10 text-gold-600/70 inline-flex size-6 items-center justify-center rounded-md',
              )}
            >
              <span className="text-[9px] font-bold">ز</span>
            </span>
          </div>
        </aside>

        {/* ============ Header — breadcrumbs + command + هویت ============ */}
        <header
          className={cn(
            'border-border/60 bg-background/80 sticky top-0 z-(--z-sticky) flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md',
            'transition-[padding] duration-300 ease-(--ease-out)',
            collapsed ? 'xl:pr-[100px]' : 'xl:pr-[312px]',
            'xl:pl-8',
          )}
        >
          {/* موبایل/تبلت — دکمه منو */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="باز کردن ناوبری مرکز عملیات"
            aria-expanded={navOpen}
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none xl:hidden"
          >
            <IconMenu2 className="size-5" stroke={1.75} />
          </button>

          {/* Breadcrumbs — semantic */}
          <nav aria-label="مسیر راهنما" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-xs">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && (
                    <IconChevronLeft
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

          {/* سوییچ تم light/dark */}
          <AdminThemeToggle />

          {/* هویت مدیر + خروج — منتقل‌شده از پایین سایدبار */}
          <AdminHeaderIdentity admin={admin} onLogout={logout} />
        </header>

        {/* ============ Content ============ */}
        <main
          className={cn(
            'pb-24 xl:pb-8',
            'transition-[padding] duration-300 ease-(--ease-out)',
            collapsed ? 'xl:pr-[76px]' : 'xl:pr-72',
          )}
        >
          <div key={pathname} className="animate-page-in mx-auto max-w-[1400px] p-4 py-6 sm:px-6">
            {children}
          </div>
        </main>

        {/* ============ Mobile/Tablet — Drawer ناوبری از سمت راست ============ */}
        <Dialog open={navOpen} onOpenChange={setNavOpen}>
          <DialogContent
            showCloseButton={false}
            className="border-border bg-card top-0 right-0 left-auto flex h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l p-0"
          >
            <DialogTitle className="sr-only">ناوبری مرکز عملیات</DialogTitle>
            <DialogDescription className="sr-only">
              دسترسی به بخش‌های مرکز عملیات بر اساس سطح دسترسی شما
            </DialogDescription>
            <div className="border-border flex h-16 shrink-0 items-center justify-between border-b px-5">
              <Link
                href="/admin/dashboard"
                onClick={() => setNavOpen(false)}
                aria-label="مرکز عملیات — داشبورد"
              >
                <Logo size="sm" textClassName="text-foreground" />
              </Link>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="بستن ناوبری"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors"
              >
                <IconX className="size-5" stroke={1.75} />
              </button>
            </div>
            <AdminNav
              permissions={admin.permissions}
              pathname={pathname}
              onNavigate={() => setNavOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminContext.Provider>
  )
}
