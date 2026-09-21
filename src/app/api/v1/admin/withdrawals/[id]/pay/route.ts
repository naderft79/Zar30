// ============================================
// Zar30 - POST /api/v1/admin/withdrawals/:id/pay
// ============================================
// پرداخت برداشت — APPROVED → PAID — permission: withdrawals.approve
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminPayWithdrawalSchema } from '@/lib/validators/finance'
import { payWithdrawal } from '@/lib/finance/withdrawal.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.WITHDRAWALS_APPROVE)
  const { id } = await ctx.params
  // بدنه اختیاری — فقط bankRef
  const json = await req.json().catch(() => ({}))
  const parsed = adminPayWithdrawalSchema.safeParse(json)
  const result = await payWithdrawal({ adminId: admin.adminId, adminRole: admin.adminRole }, id, {
    ...getSessionMeta(req),
    bankRef: parsed.success ? parsed.data.bankRef : undefined,
  })
  return ok({ withdrawal: result })
})
