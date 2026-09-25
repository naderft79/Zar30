// ============================================
// Zar30 - GET /api/v1/admin/payments/:id
// ============================================
// جزئیات پرداخت درگاه — permission: payments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminPayment } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.PAYMENTS_READ)
  const { id } = await ctx.params
  const detail = await getAdminPayment(id)
  if (!detail) throw ApiError.notFound('پرداخت یافت نشد')
  return ok({ payment: detail })
})
