// ============================================
// Zar30 - GET /api/v1/admin/transfers/:id
// ============================================
// جزئیات انتقال — permission: transfers.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminTransfer } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.TRANSFERS_READ)
  const { id } = await ctx.params
  const detail = await getAdminTransfer(id)
  if (!detail) throw ApiError.notFound('انتقال یافت نشد')
  return ok({ transfer: detail })
})
