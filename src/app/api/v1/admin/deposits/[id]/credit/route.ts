// ============================================
// Zar30 - POST /api/v1/admin/deposits/:id/credit
// ============================================
// اعتبارسنجی واریز — PENDING → COMPLETED + ledger — permission: deposits.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { creditDeposit } from '@/lib/finance/deposit.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DEPOSITS_REVIEW)
  const { id } = await ctx.params
  const result = await creditDeposit(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok({ deposit: result })
})
