// ============================================
// Zar30 - GET /api/v1/admin/delivery/:id
// ============================================
// جزئیات درخواست تحویل + audit — permission: delivery.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getAdminDelivery } from '@/lib/services/admin-delivery.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.DELIVERY_READ)
  const { id } = await ctx.params
  const delivery = await getAdminDelivery(id)
  if (!delivery) throw ApiError.notFound('درخواست تحویل یافت نشد')
  return ok({ delivery })
})
