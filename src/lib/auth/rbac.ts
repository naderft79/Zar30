// ============================================
// Zar30 - RBAC Foundation (Phase 2)
// ============================================
// ساختار Authorization — Admin Panel کامل در Phaseهای 14-16
// هر endpoint حساس باید server-side این را enforce کند
// ============================================

import { ApiError } from '@/lib/errors/api-error'

// Permissionهای granular — نام‌گذاری: domain.action
export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  KYC_READ: 'kyc.read',
  KYC_REVIEW: 'kyc.review',
  ORDERS_READ: 'orders.read',
  ORDERS_EXECUTE: 'orders.execute',
  WITHDRAWALS_READ: 'withdrawals.read',
  WITHDRAWALS_APPROVE: 'withdrawals.approve',
  PRICING_READ: 'pricing.read',
  PRICING_UPDATE: 'pricing.update',
  LEDGER_READ: 'ledger.read',
  REPORTS_READ: 'reports.read',
  TICKETS_READ: 'tickets.read',
  TICKETS_REPLY: 'tickets.reply',
  CMS_MANAGE: 'cms.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_READ: 'audit.read',
  FLAGS_MANAGE: 'flags.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// نقش‌های ادمین (طبق MEGAPLAN بخش ۲۲) — نقش USER کاربر عادی است و Permission ادمین ندارد
export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  USER: [],
  SUPER_ADMIN: Object.values(PERMISSIONS),
  FINANCE: [
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.REPORTS_READ,
  ],
  SUPPORT: [PERMISSIONS.USERS_READ, PERMISSIONS.TICKETS_READ, PERMISSIONS.TICKETS_REPLY],
  KYC: [PERMISSIONS.KYC_READ, PERMISSIONS.KYC_REVIEW, PERMISSIONS.USERS_READ],
  RISK: [PERMISSIONS.USERS_READ, PERMISSIONS.ORDERS_READ, PERMISSIONS.REPORTS_READ],
  CONTENT: [PERMISSIONS.CMS_MANAGE],
  OPERATIONS: [PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.FLAGS_MANAGE, PERMISSIONS.PRICING_UPDATE],
  ANALYST: [PERMISSIONS.REPORTS_READ, PERMISSIONS.ORDERS_READ, PERMISSIONS.LEDGER_READ],
  READ_ONLY: [PERMISSIONS.USERS_READ, PERMISSIONS.REPORTS_READ, PERMISSIONS.AUDIT_READ],
}

export type Role = keyof typeof ROLE_PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw ApiError.forbidden('دسترسی لازم برای این عملیات را ندارید')
  }
}
