// ============================================
// Zar30 - RBAC — Admin Security Foundation
// ============================================
// Permission catalog مرکزی — نام‌گذاری: domain.action
// resolve = role defaults + custom grant − custom revoke
// SUPER_ADMIN همیشه همه catalog را دارد و revoke روی آن اثر نمی‌کند
// ============================================

import type { AdminRole } from '@/generated/prisma'
import { ApiError } from '@/lib/errors/api-error'

export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_STATUS: 'users.status',
  KYC_READ: 'kyc.read',
  KYC_REVIEW: 'kyc.review',
  KYC_APPROVE: 'kyc.approve',
  KYC_REJECT: 'kyc.reject',
  ACCOUNTS_READ: 'accounts.read',
  WALLETS_READ: 'wallets.read',
  WALLETS_FREEZE: 'wallets.freeze',
  WALLETS_UNFREEZE: 'wallets.unfreeze',
  LEDGER_READ: 'ledger.read',
  GOLD_READ: 'gold.read',
  ORDERS_READ: 'orders.read',
  ORDERS_REVIEW: 'orders.review',
  TRANSACTIONS_READ: 'transactions.read',
  TRANSACTIONS_REVIEW: 'transactions.review',
  TRANSACTIONS_REVERSE: 'transactions.reverse',
  DEPOSITS_READ: 'deposits.read',
  DEPOSITS_REVIEW: 'deposits.review',
  WITHDRAWALS_READ: 'withdrawals.read',
  WITHDRAWALS_APPROVE: 'withdrawals.approve',
  WITHDRAWALS_REJECT: 'withdrawals.reject',
  PRICING_READ: 'pricing.read',
  PRICING_UPDATE: 'pricing.update',
  INSTALLMENTS_READ: 'installments.read',
  INSTALLMENTS_REVIEW: 'installments.review',
  INSTALLMENTS_MANAGE: 'installments.manage',
  INVESTMENTS_READ: 'investments.read',
  INVESTMENTS_MANAGE: 'investments.manage',
  REFERRALS_READ: 'referrals.read',
  REFERRALS_MANAGE: 'referrals.manage',
  TICKETS_READ: 'tickets.read',
  TICKETS_REPLY: 'tickets.reply',
  TICKETS_ASSIGN: 'tickets.assign',
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_SEND: 'notifications.send',
  NOTIFICATIONS_MANAGE_TEMPLATES: 'notifications.manage_templates',
  CONTENT_READ: 'content.read',
  CONTENT_MANAGE: 'content.manage',
  CONTENT_PUBLISH: 'content.publish',
  SEO_READ: 'seo.read',
  SEO_MANAGE: 'seo.manage',
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',
  RISK_READ: 'risk.read',
  RISK_REVIEW: 'risk.review',
  RISK_MANAGE_RULES: 'risk.manage_rules',
  FRAUD_READ: 'fraud.read',
  FRAUD_REVIEW: 'fraud.review',
  SECURITY_READ: 'security.read',
  SECURITY_MANAGE: 'security.manage',
  AUDIT_READ: 'audit.read',
  TEAM_READ: 'team.read',
  TEAM_MANAGE: 'team.manage',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_READ: 'settings.read',
  SETTINGS_MANAGE: 'settings.manage',
  SYSTEM_READ: 'system.read',
  SYSTEM_MANAGE: 'system.manage',
  API_READ: 'api.read',
  API_MANAGE: 'api.manage',
  FLAGS_READ: 'flags.read',
  FLAGS_MANAGE: 'flags.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
export type Role = AdminRole

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[]
const CATALOG = new Set<string>(ALL_PERMISSIONS)
const READ_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith('.read'))

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && CATALOG.has(value)
}

// نقش‌های ادمین (طبق MEGAPLAN بخش ۲۲) — least privilege
const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  FINANCE: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.WALLETS_READ,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.GOLD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_REVIEW,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRANSACTIONS_REVIEW,
    PERMISSIONS.TRANSACTIONS_REVERSE,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.DEPOSITS_REVIEW,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.WITHDRAWALS_REJECT,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.INSTALLMENTS_READ,
    PERMISSIONS.INSTALLMENTS_REVIEW,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.REFERRALS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  SUPPORT: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.KYC_READ,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_REPLY,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_SEND,
  ],
  KYC: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.KYC_READ,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.KYC_APPROVE,
    PERMISSIONS.KYC_REJECT,
  ],
  RISK: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.RISK_READ,
    PERMISSIONS.RISK_REVIEW,
    PERMISSIONS.RISK_MANAGE_RULES,
    PERMISSIONS.FRAUD_READ,
    PERMISSIONS.FRAUD_REVIEW,
    PERMISSIONS.SECURITY_READ,
    PERMISSIONS.SECURITY_MANAGE,
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.WALLETS_READ,
    PERMISSIONS.WALLETS_FREEZE,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRANSACTIONS_REVIEW,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  CONTENT: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.SEO_READ,
    PERMISSIONS.SEO_MANAGE,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.NOTIFICATIONS_MANAGE_TEMPLATES,
  ],
  OPERATIONS: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.FLAGS_READ,
    PERMISSIONS.FLAGS_MANAGE,
    PERMISSIONS.SYSTEM_READ,
    PERMISSIONS.SYSTEM_MANAGE,
    PERMISSIONS.API_READ,
    PERMISSIONS.API_MANAGE,
    PERMISSIONS.REPORTS_READ,
  ],
  ANALYST: [...READ_PERMISSIONS, PERMISSIONS.REPORTS_EXPORT],
  READ_ONLY: READ_PERMISSIONS,
}

// ساختار custom permissions روی AdminUser.permissions (Json):
//   { "grant": ["domain.action"], "revoke": ["domain.action"] }
//   آرایه legacy به‌عنوان grant خوانده می‌شود — مقادیر خارج از catalog نادیده گرفته می‌شوند
function validPermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return []
  return value.filter(isPermission)
}

export function resolvePermissions(role: AdminRole, custom: unknown): readonly Permission[] {
  // SUPER_ADMIN غیرقابل‌کاهش است — revoke اثر ندارد
  if (role === 'SUPER_ADMIN') return ALL_PERMISSIONS

  let grants: Permission[] = []
  let revokes: Permission[] = []
  if (Array.isArray(custom)) {
    grants = validPermissions(custom)
  } else if (custom && typeof custom === 'object') {
    const c = custom as { grant?: unknown; revoke?: unknown }
    grants = validPermissions(c.grant)
    revokes = validPermissions(c.revoke)
  }

  const resolved = new Set<Permission>(ROLE_PERMISSIONS[role] ?? [])
  for (const p of grants) resolved.add(p)
  for (const p of revokes) resolved.delete(p)
  return [...resolved]
}

export function hasPermission(permissions: readonly Permission[], permission: Permission): boolean {
  return permissions.includes(permission)
}

export function requirePermission(
  permissions: readonly Permission[],
  permission: Permission,
): void {
  if (!hasPermission(permissions, permission)) {
    throw ApiError.forbidden('دسترسی لازم برای این عملیات را ندارید')
  }
}
