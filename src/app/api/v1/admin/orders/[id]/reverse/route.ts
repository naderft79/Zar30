// ============================================
// Zar30 - POST /api/v1/admin/orders/:id/reverse
// ============================================
// برگشت سفارش — سند جبرانی؛ سفارش به REVERSED می‌رود
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

  const order = await prisma.order.findUnique({
    where: { id },
    select: { journalEntryId: true },
  })
  if (!order?.journalEntryId) throw FinanceErrors.orderNotFound()

  const result = await reverseJournalEntry(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    order.journalEntryId,
    reason,
    getSessionMeta(req),
  )
  return ok({ reversal: result })
})
