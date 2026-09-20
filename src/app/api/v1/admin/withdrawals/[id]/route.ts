// ============================================
// Zar30 - GET /api/v1/admin/withdrawals/:id
// ============================================
// جزئیات برداشت + audit — IBAN فقط masked — permission: withdrawals.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminWithdrawalDetail } from '@/lib/services/admin-finance.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.WITHDRAWALS_READ)
  const { id } = await ctx.params
  return ok({ withdrawal: await getAdminWithdrawalDetail(id) })
})
