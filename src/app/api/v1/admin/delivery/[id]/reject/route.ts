// ============================================
// Zar30 - POST /api/v1/admin/delivery/:id/reject
// ============================================
// رد درخواست — قفل طلا آزاد و هزینه برمی‌گردد — permission: delivery.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminReasonSchema } from '@/lib/validators/admin-delivery'
import { rejectDelivery } from '@/lib/finance/delivery.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DELIVERY_REVIEW)
  const { id } = await ctx.params
  const body = await parseBody(req, adminReasonSchema)
  const result = await rejectDelivery(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body.reason,
    getSessionMeta(req),
  )
  return ok({ delivery: result })
})
