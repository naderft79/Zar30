// ============================================
// Zar30 - Admin Navigation Unit Tests
// ============================================
// یکتایی، اعتبار permissionها، active logic، breadcrumbs، permission filter
// ============================================

import { describe, expect, it } from 'vitest'
import {
  ADMIN_NAV_SECTIONS,
  canSeeAdminItem,
  getAdminBreadcrumbs,
  isAdminNavItemActive,
} from '@/config/admin-navigation'
import { isPermission, resolvePermissions } from '@/lib/auth/rbac'

const ALL_ITEMS = ADMIN_NAV_SECTIONS.flatMap((s) => s.items)

function findItem(href: string) {
  return ALL_ITEMS.find((i) => i.href === href)
}

describe('Admin navigation config', () => {
  it('keyهای section و item یکتا هستند', () => {
    const sectionKeys = ADMIN_NAV_SECTIONS.map((s) => s.key)
    expect(new Set(sectionKeys).size).toBe(sectionKeys.length)
    const itemKeys = ALL_ITEMS.map((i) => i.key)
    expect(new Set(itemKeys).size).toBe(itemKeys.length)
    const hrefs = ALL_ITEMS.map((i) => i.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('همه permissionها در catalog معتبرند', () => {
    for (const item of ALL_ITEMS) {
      expect(item.permissions.length).toBeGreaterThan(0)
      for (const p of item.permissions) {
        expect(isPermission(p)).toBe(true)
      }
    }
  })

  it('همه hrefها زیر /admin هستند', () => {
    for (const item of ALL_ITEMS) {
      expect(item.href.startsWith('/admin/')).toBe(true)
    }
  })
})

describe('isAdminNavItemActive', () => {
  it('داشبورد فقط exact است', () => {
    const dashboard = findItem('/admin/dashboard')!
    expect(isAdminNavItemActive(dashboard, '/admin/dashboard')).toBe(true)
    expect(isAdminNavItemActive(dashboard, '/admin/dashboard/x')).toBe(false)
    expect(isAdminNavItemActive(dashboard, '/admin/users')).toBe(false)
  })

  it('سایر itemها prefix هستند — detail page هم active می‌ماند', () => {
    const users = findItem('/admin/users')!
    expect(isAdminNavItemActive(users, '/admin/users')).toBe(true)
    expect(isAdminNavItemActive(users, '/admin/users/abc-123')).toBe(true)
    expect(isAdminNavItemActive(users, '/admin/kyc')).toBe(false)
    // boundary: /admin/usersx نباید match شود
    expect(isAdminNavItemActive(users, '/admin/usersx')).toBe(false)
  })
})

describe('getAdminBreadcrumbs', () => {
  it('داشبورد فقط خانه ادمین است', () => {
    const crumbs = getAdminBreadcrumbs('/admin/dashboard')
    expect(crumbs).toEqual([{ label: 'مرکز عملیات' }])
  })

  it('صفحه section → خانه + label آیتم', () => {
    const crumbs = getAdminBreadcrumbs('/admin/users')
    expect(crumbs[0]).toEqual({ label: 'مرکز عملیات', href: '/admin/dashboard' })
    expect(crumbs[1]!.label).toBe('کاربران')
    expect(crumbs[1]!.href).toBeUndefined() // آخرین crumb لینک نیست
  })

  it('detail page → segment اضافی به breadcrumb می‌افتد', () => {
    const crumbs = getAdminBreadcrumbs('/admin/kyc/sub-123')
    expect(crumbs.map((c) => c.label)).toEqual(['مرکز عملیات', 'احراز هویت', 'sub-123'])
  })

  it('طولانی‌ترین match برنده است — roles زیر team', () => {
    const crumbs = getAdminBreadcrumbs('/admin/team/roles')
    expect(crumbs.map((c) => c.label)).toEqual(['مرکز عملیات', 'نقش‌ها و دسترسی‌ها'])
  })

  it('مسیر ناشناخته → فقط خانه ادمین', () => {
    expect(getAdminBreadcrumbs('/admin/unknown')).toEqual([
      { label: 'مرکز عملیات', href: '/admin/dashboard' },
    ])
  })
})

describe('canSeeAdminItem — permission filter', () => {
  it('SUPPORT فقط آیتم‌های مجازش را می‌بیند', () => {
    const perms = resolvePermissions('SUPPORT', null)
    const visible = ALL_ITEMS.filter((i) => canSeeAdminItem(i, perms)).map((i) => i.href)
    expect(visible).toContain('/admin/users')
    expect(visible).toContain('/admin/support')
    expect(visible).toContain('/admin/dashboard')
    expect(visible).not.toContain('/admin/withdrawals')
    expect(visible).not.toContain('/admin/settings')
  })

  it('SUPER_ADMIN همه آیتم‌ها را می‌بیند', () => {
    const perms = resolvePermissions('SUPER_ADMIN', null)
    for (const item of ALL_ITEMS) {
      expect(canSeeAdminItem(item, perms)).toBe(true)
    }
  })

  it('revoke یک permission، item را مخفی می‌کند', () => {
    const perms = resolvePermissions('KYC', { revoke: ['kyc.read'] })
    const kycItem = findItem('/admin/kyc')!
    expect(canSeeAdminItem(kycItem, perms)).toBe(false)
    const usersItem = findItem('/admin/users')!
    expect(canSeeAdminItem(usersItem, perms)).toBe(true)
  })
})
