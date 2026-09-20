// ============================================
// Zar30 - Admin Command Search Service
// ============================================
// جستجوی سراسری ادمین — permission-aware: فقط categoryهایی query می‌شوند
// که admin permission متناظرشان را دارد؛ خروجی بدون داده حساس
// ترتیب قطعی: user → kyc → order → transaction → ticket → audit
// ============================================

import prisma from '@/lib/db/prisma'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'

export type AdminSearchResult = {
  type: 'user' | 'kyc' | 'order' | 'transaction' | 'ticket' | 'audit'
  id: string
  label: string
  description: string
  href: string
  status?: string
}

const CATEGORY_LIMIT = 5
const TOTAL_LIMIT = 25

// ادغام round-robin قطعی — همه categoryهای دارای نتیجه representation دارند
export function mergeSearchGroups(
  groups: readonly AdminSearchResult[][],
  limit = TOTAL_LIMIT,
): AdminSearchResult[] {
  const merged: AdminSearchResult[] = []
  const maxLength = Math.max(0, ...groups.map((group) => group.length))
  for (let index = 0; index < maxLength && merged.length < limit; index += 1) {
    for (const group of groups) {
      const item = group[index]
      if (item) merged.push(item)
      if (merged.length === limit) break
    }
  }
  return merged
}

function personName(user: {
  firstName?: string | null
  lastName?: string | null
  mobile?: string | null
}): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || (user.mobile ?? '')
}

export async function searchAdminEntities(
  q: string,
  permissions: readonly Permission[],
): Promise<AdminSearchResult[]> {
  const query = q.trim()
  if (query.length < 2 || query.length > 80) return []

  const contains = { contains: query, mode: 'insensitive' as const }
  const tasks: Promise<AdminSearchResult[]>[] = []

  if (hasPermission(permissions, PERMISSIONS.USERS_READ)) {
    tasks.push(
      prisma.user
        .findMany({
          where: {
            OR: [
              { mobile: contains },
              { firstName: contains },
              { lastName: contains },
              { email: contains },
            ],
          },
          select: { id: true, mobile: true, firstName: true, lastName: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          rows.map((u) => ({
            type: 'user' as const,
            id: u.id,
            label: personName(u),
            description: u.mobile,
            href: `/admin/users/${u.id}`,
            status: u.status,
          })),
        ),
    )
  }

  if (hasPermission(permissions, PERMISSIONS.KYC_READ)) {
    tasks.push(
      prisma.kycSubmission
        .findMany({
          where: {
            OR: [{ id: contains }, { user: { mobile: contains } }],
          },
          select: {
            id: true,
            status: true,
            level: true,
            user: { select: { mobile: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          // nationalCode هرگز در label/description قرار نمی‌گیرد
          rows.map((s) => ({
            type: 'kyc' as const,
            id: s.id,
            label: `درخواست احراز هویت — ${personName(s.user)}`,
            description: `سطح ${s.level}`,
            href: `/admin/kyc/${s.id}`,
            status: s.status,
          })),
        ),
    )
  }

  if (hasPermission(permissions, PERMISSIONS.ORDERS_READ)) {
    tasks.push(
      prisma.order
        .findMany({
          where: { OR: [{ id: contains }, { user: { mobile: contains } }] },
          select: {
            id: true,
            type: true,
            status: true,
            user: { select: { mobile: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          rows.map((o) => ({
            type: 'order' as const,
            id: o.id,
            label: `سفارش ${o.type === 'BUY' ? 'خرید' : 'فروش'} ${o.id.slice(0, 8)}`,
            description: `کاربر ${o.user.mobile}`,
            href: `/admin/orders/${o.id}`,
            status: o.status,
          })),
        ),
    )
  }

  if (hasPermission(permissions, PERMISSIONS.TRANSACTIONS_READ)) {
    tasks.push(
      prisma.transaction
        .findMany({
          where: { OR: [{ id: contains }, { user: { mobile: contains } }] },
          select: {
            id: true,
            type: true,
            status: true,
            user: { select: { mobile: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          rows.map((t) => ({
            type: 'transaction' as const,
            id: t.id,
            label: `تراکنش ${t.id.slice(0, 8)}`,
            description: `${t.type} — کاربر ${t.user.mobile}`,
            href: `/admin/transactions/${t.id}`,
            status: t.status,
          })),
        ),
    )
  }

  if (hasPermission(permissions, PERMISSIONS.TICKETS_READ)) {
    tasks.push(
      prisma.ticket
        .findMany({
          where: {
            OR: [{ id: contains }, { subject: contains }, { user: { mobile: contains } }],
          },
          select: {
            id: true,
            subject: true,
            status: true,
            user: { select: { mobile: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          rows.map((t) => ({
            type: 'ticket' as const,
            id: t.id,
            label: t.subject,
            description: `کاربر ${t.user.mobile}`,
            href: `/admin/support/${t.id}`,
            status: t.status,
          })),
        ),
    )
  }

  if (hasPermission(permissions, PERMISSIONS.AUDIT_READ)) {
    tasks.push(
      prisma.auditLog
        .findMany({
          where: { OR: [{ action: contains }, { entityId: contains }] },
          select: { id: true, action: true, entityType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_LIMIT,
        })
        .then((rows) =>
          rows.map((a) => ({
            type: 'audit' as const,
            id: a.id,
            label: a.action,
            description: a.entityType,
            href: `/admin/audit-logs/${a.id}`,
          })),
        ),
    )
  }

  // ترتیب groups = ترتیب push taskها؛ merge round-robin تا همه categoryها representation داشته باشند
  const groups = await Promise.all(tasks)
  return mergeSearchGroups(groups)
}
