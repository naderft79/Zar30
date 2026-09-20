// ============================================
// Zar30 - Audit Logging (Phase 2 + Admin Security Foundation)
// ============================================
// ثبت append-only در AuditLog — شکست نوشتن Audit هرگز silent نیست
// writeAudit: fail-open (سازگاری) | writeAuditStrict: fail-closed برای mutationهای حساس
// toAuditData: برای نوشتن audit داخل DB transaction همان عملیات
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { logger } from '@/lib/logger/logger'

export interface AuditEntry {
  actorType?: 'user' | 'admin' | 'system'
  actorId?: string
  actorRole?: string
  action: string
  entityType?: string
  entityId?: string
  targetUserId?: string
  requestId?: string
  reason?: string
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
}

// نگاشت AuditEntry به input آماده create — قابل استفاده در tx.auditLog.create
export function toAuditData(entry: AuditEntry): Prisma.AuditLogUncheckedCreateInput {
  return {
    actorType: entry.actorType ?? 'system',
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    action: entry.action,
    entityType: entry.entityType ?? 'unknown',
    entityId: entry.entityId,
    targetUserId: entry.targetUserId,
    requestId: entry.requestId,
    reason: entry.reason,
    before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : undefined,
    after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : undefined,
    ip: entry.ip,
    userAgent: entry.userAgent,
  }
}

export async function writeAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({ data: toAuditData(entry) })
  } catch (err) {
    // Audit شکست خورد — برای سیستم مالی قابل قبول نیست silent باشد
    logger.error({ err, action: entry.action }, 'Audit log write failed')
  }
}

// مسیر strict برای عملیات حساس ادمین — خطا پرتاب می‌شود و عملیات fail می‌کند
export async function writeAuditStrict(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({ data: toAuditData(entry) })
}
