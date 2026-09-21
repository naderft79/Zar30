// ============================================
// Zar30 - POST /api/v1/admin/withdrawals/:id/approve
// ============================================
// تایید برداشت — PENDING → APPROVED — permission: withdrawals.approve
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { approveWithdrawal } from '@/lib/finance/withdrawal.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.WITHDRAWALS_APPROVE)
  const { id } = await ctx.params
  const result = await approveWithdrawal(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok({ withdrawal: result })
})
