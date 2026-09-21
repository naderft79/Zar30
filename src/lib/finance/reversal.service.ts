// ============================================
// Zar30 - Reversal Service
// ============================================
// برگشت سند = سند جبرانی جدید؛ سند اصلی هرگز ویرایش/حذف نمی‌شود
// محدوده: اسناد ORDER و DEPOSIT — برداشت از مسیر reject/pay می‌رود
// ============================================

import prisma from '@/lib/db/prisma'
import { toAuditData } from '@/lib/audit/audit'
import { FinanceErrors } from './errors'
import { reverseJournal } from './ledger.service'
import { notifyFinancial } from './notify'

const REVERSIBLE_TYPES = new Set(['ORDER', 'DEPOSIT'])

export async function reverseJournalEntry(
  ctx: { adminId: string; adminRole: string },
  journalId: string,
  reason: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const journal = await tx.journalEntry.findUnique({ where: { id: journalId } })
    if (!journal) throw FinanceErrors.journalNotFound()
    if (
      journal.status !== 'POSTED' ||
      journal.reversalOf ||
      !journal.referenceType ||
      !REVERSIBLE_TYPES.has(journal.referenceType)
    ) {
      throw FinanceErrors.journalNotReversible()
    }

    const reversal = await reverseJournal(tx, journalId, { reason, actorId: ctx.adminId })

    // وضعیت موجودیت مبنا را به REVERSED می‌بریم — رکورد اصلی دست‌نخورده می‌ماند
    if (journal.referenceType === 'ORDER' && journal.referenceId) {
      await tx.order.update({
        where: { id: journal.referenceId },
        data: { status: 'REVERSED' },
      })
    } else if (journal.referenceType === 'DEPOSIT' && journal.referenceId) {
      await tx.transaction.update({
        where: { id: journal.referenceId },
        data: { status: 'REVERSED' },
      })
    }

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'journal.reverse',
        entityType: 'journal_entry',
        entityId: journalId,
        reason,
        before: {
          status: 'POSTED',
          referenceType: journal.referenceType,
          referenceId: journal.referenceId,
        },
        after: { status: 'REVERSED', reversalJournalId: reversal.id },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    // کاربرِ موجودیت مبنا برای notification
    let targetUserId: string | null = null
    if (journal.referenceType === 'ORDER' && journal.referenceId) {
      const o = await tx.order.findUnique({
        where: { id: journal.referenceId },
        select: { userId: true },
      })
      targetUserId = o?.userId ?? null
    } else if (journal.referenceType === 'DEPOSIT' && journal.referenceId) {
      const t = await tx.transaction.findUnique({
        where: { id: journal.referenceId },
        select: { userId: true },
      })
      targetUserId = t?.userId ?? null
    }

    return { reversalId: reversal.id, originalId: journalId, targetUserId }
  })

  if (result.targetUserId) {
    notifyFinancial(result.targetUserId, 'transaction_reversed', 'یک تراکنش برگشت خورد', '', {
      journalId: result.originalId,
    })
  }
  return result
}
