// ============================================
// Zar30 - POST /api/v1/admin/deposits/:id/reject
// ============================================
// رد واریز — PENDING → FAILED — permission: deposits.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRejectSchema } from '@/lib/validators/finance'
import { rejectDeposit } from '@/lib/finance/deposit.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DEPOSITS_REVIEW)
  const { id } = await ctx.params
  const { reason } = await parseBody(req, adminRejectSchema)
  const result = await rejectDeposit(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    reason,
    getSessionMeta(req),
  )
  return ok({ deposit: result })
})
