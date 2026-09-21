// ============================================
// Zar30 - POST /api/v1/admin/withdrawals/:id/reject
// ============================================
// رد برداشت — آزادسازی قفل — permission: withdrawals.reject
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRejectSchema } from '@/lib/validators/finance'
import { rejectWithdrawal } from '@/lib/finance/withdrawal.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.WITHDRAWALS_REJECT)
  const { id } = await ctx.params
  const { reason } = await parseBody(req, adminRejectSchema)
  const result = await rejectWithdrawal(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    reason,
    getSessionMeta(req),
  )
  return ok({ withdrawal: result })
})
