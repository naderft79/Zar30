// ============================================
// Zar30 - RBAC Unit Tests (Admin Security Foundation)
// ============================================
// role defaults + custom grant/revoke + immutability SUPER_ADMIN + resolver
// ============================================

import { describe, expect, it } from 'vitest'
import {
  PERMISSIONS,
  hasPermission,
  isPermission,
  requirePermission,
  resolvePermissions,
} from '@/lib/auth/rbac'

const ALL = Object.values(PERMISSIONS)

describe('RBAC catalog', () => {
  it('isPermission فقط مقادیر catalog را قبول می‌کند', () => {
    expect(isPermission('kyc.read')).toBe(true)
    expect(isPermission('users.status')).toBe(true)
    expect(isPermission('kyc.delete')).toBe(false)
    expect(isPermission('admin.god')).toBe(false)
    expect(isPermission(42)).toBe(false)
    expect(isPermission(null)).toBe(false)
  })
})

describe('resolvePermissions — role defaults', () => {
  it('SUPER_ADMIN همه permissionهای catalog را دارد', () => {
    const perms = resolvePermissions('SUPER_ADMIN', null)
    expect(perms).toHaveLength(ALL.length)
    for (const p of ALL) expect(perms).toContain(p)
  })

  it('READ_ONLY فقط permissionهای .read را دارد', () => {
    const perms = resolvePermissions('READ_ONLY', null)
    expect(perms.length).toBeGreaterThan(0)
    for (const p of perms) expect(p.endsWith('.read')).toBe(true)
    expect(perms).toContain(PERMISSIONS.KYC_READ)
    expect(perms).toContain(PERMISSIONS.AUDIT_READ)
    expect(perms).not.toContain(PERMISSIONS.KYC_REVIEW)
  })

  it('KYC فقط users.read + kyc.* دارد', () => {
    const perms = resolvePermissions('KYC', null)
    expect(perms).toContain(PERMISSIONS.USERS_READ)
    expect(perms).toContain(PERMISSIONS.KYC_READ)
    expect(perms).toContain(PERMISSIONS.KYC_REVIEW)
    expect(perms).toContain(PERMISSIONS.KYC_APPROVE)
    expect(perms).toContain(PERMISSIONS.KYC_REJECT)
    expect(perms).not.toContain(PERMISSIONS.WITHDRAWALS_APPROVE)
    expect(perms).not.toContain(PERMISSIONS.USERS_UPDATE)
  })

  it('SUPPORT به tickets دسترسی دارد ولی approve مالی ندارد', () => {
    const perms = resolvePermissions('SUPPORT', null)
    expect(perms).toContain(PERMISSIONS.TICKETS_READ)
    expect(perms).toContain(PERMISSIONS.TICKETS_REPLY)
    expect(perms).toContain(PERMISSIONS.USERS_READ)
    expect(perms).toContain(PERMISSIONS.KYC_READ)
    expect(perms).not.toContain(PERMISSIONS.WITHDRAWALS_APPROVE)
    expect(perms).not.toContain(PERMISSIONS.KYC_APPROVE)
  })

  it('FINANCE به عملیات مالی دسترسی دارد ولی به team manage ندارد', () => {
    const perms = resolvePermissions('FINANCE', null)
    expect(perms).toContain(PERMISSIONS.WITHDRAWALS_APPROVE)
    expect(perms).toContain(PERMISSIONS.WITHDRAWALS_REJECT)
    expect(perms).toContain(PERMISSIONS.DEPOSITS_REVIEW)
    expect(perms).toContain(PERMISSIONS.LEDGER_READ)
    expect(perms).not.toContain(PERMISSIONS.TEAM_MANAGE)
    expect(perms).not.toContain(PERMISSIONS.KYC_APPROVE)
  })

  it('ANALYST همه readها + reports.export دارد ولی mutation ندارد', () => {
    const perms = resolvePermissions('ANALYST', null)
    expect(perms).toContain(PERMISSIONS.REPORTS_READ)
    expect(perms).toContain(PERMISSIONS.REPORTS_EXPORT)
    expect(perms).toContain(PERMISSIONS.LEDGER_READ)
    for (const p of perms) {
      expect(p.endsWith('.read') || p === PERMISSIONS.REPORTS_EXPORT).toBe(true)
    }
  })
})

describe('resolvePermissions — custom grant/revoke', () => {
  it('grant آبجکتی permission جدید اضافه می‌کند', () => {
    const perms = resolvePermissions('SUPPORT', { grant: ['audit.read'] })
    expect(perms).toContain(PERMISSIONS.AUDIT_READ)
    expect(perms).toContain(PERMISSIONS.TICKETS_READ)
  })

  it('revoke آبجکتی permission پیش‌فرض را حذف می‌کند', () => {
    const perms = resolvePermissions('KYC', { revoke: ['kyc.approve'] })
    expect(perms).not.toContain(PERMISSIONS.KYC_APPROVE)
    expect(perms).toContain(PERMISSIONS.KYC_REVIEW)
  })

  it('آرایه legacy به‌عنوان grant خوانده می‌شود', () => {
    const perms = resolvePermissions('SUPPORT', ['audit.read', 'reports.read'])
    expect(perms).toContain(PERMISSIONS.AUDIT_READ)
    expect(perms).toContain(PERMISSIONS.REPORTS_READ)
  })

  it('مقادیر نامعتبر در grant/revoke نادیده گرفته می‌شوند', () => {
    const perms = resolvePermissions('SUPPORT', {
      grant: ['kyc.delete', 'admin.god', 42, null],
      revoke: ['kyc.fake'],
    })
    expect(perms).not.toContain('kyc.delete')
    expect(perms).not.toContain('admin.god')
    expect(perms).toContain(PERMISSIONS.TICKETS_READ)
    // بدون دور زدن catalog — همه خروجی باید valid باشد
    for (const p of perms) expect(isPermission(p)).toBe(true)
  })

  it('custom خراب/null امن است — فقط defaults', () => {
    expect(resolvePermissions('SUPPORT', undefined)).toEqual(resolvePermissions('SUPPORT', null))
    expect(resolvePermissions('SUPPORT', 'garbage')).toEqual(resolvePermissions('SUPPORT', null))
    expect(resolvePermissions('SUPPORT', 42)).toEqual(resolvePermissions('SUPPORT', null))
  })
})

describe('resolvePermissions — SUPER_ADMIN غیرقابل‌کاهش', () => {
  it('revoke روی SUPER_ADMIN اثر ندارد', () => {
    const perms = resolvePermissions('SUPER_ADMIN', {
      revoke: ['settings.manage', 'audit.read'],
    })
    expect(perms).toHaveLength(ALL.length)
    expect(perms).toContain(PERMISSIONS.SETTINGS_MANAGE)
    expect(perms).toContain(PERMISSIONS.AUDIT_READ)
  })
})

describe('hasPermission / requirePermission', () => {
  it('hasPermission روی لیست resolve‌شده کار می‌کند', () => {
    const perms = resolvePermissions('KYC', null)
    expect(hasPermission(perms, PERMISSIONS.KYC_REVIEW)).toBe(true)
    expect(hasPermission(perms, PERMISSIONS.SETTINGS_MANAGE)).toBe(false)
  })

  it('requirePermission بدون permission خطای forbidden می‌دهد', () => {
    const support = resolvePermissions('SUPPORT', null)
    expect(() => requirePermission(support, PERMISSIONS.SETTINGS_MANAGE)).toThrow()
    const superAdmin = resolvePermissions('SUPER_ADMIN', null)
    expect(() => requirePermission(superAdmin, PERMISSIONS.SETTINGS_MANAGE)).not.toThrow()
  })
})
