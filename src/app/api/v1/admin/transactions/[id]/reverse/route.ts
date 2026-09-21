// ============================================
// Zar30 - POST /api/v1/admin/transactions/:id/reverse
// ============================================
// برگشت سند تراکنش — سند جبرانی؛ history حفظ می‌شود
// permission: transactions.reverse
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminReverseSchema } from '@/lib/validators/finance'
import { reverseJournalEntry } from '@/lib/finance/reversal.service'
import prisma from '@/lib/db/prisma'
import { FinanceErrors } from '@/lib/finance/errors'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.TRANSACTIONS_REVERSE)
  const { id } = await ctx.params
  const { reason } = await parseBody(req, adminReverseSchema)

  // سند تراکنش — فقط تراکنش‌های دارای journal قابل برگشت‌اند
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: { journalEntryId: true },
  })
  if (!transaction?.journalEntryId) throw FinanceErrors.depositNotFound()

  const result = await reverseJournalEntry(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    transaction.journalEntryId,
    reason,
    getSessionMeta(req),
  )
  return ok({ reversal: result })
})
