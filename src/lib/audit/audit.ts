// ============================================
// Zar30 - Audit Logging (Phase 2)
// ============================================
// ثبت append-only در AuditLog — شکست نوشتن Audit هرگز silent نیست
// ============================================

import prisma from '@/lib/db/prisma'
import { logger } from '@/lib/logger/logger'

export interface AuditEntry {
  actorType?: 'user' | 'admin' | 'system'
  actorId?: string
  action: string
  entityType?: string
  entityId?: string
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
}

export async function writeAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: entry.actorType ?? 'system',
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType ?? 'unknown',
        entityId: entry.entityId,
        before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : undefined,
        after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : undefined,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    })
  } catch (err) {
    // Audit شکست خورد — برای سیستم مالی قابل قبول نیست silent باشد
    logger.error({ err, action: entry.action }, 'Audit log write failed')
  }
}
