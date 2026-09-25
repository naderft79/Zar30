// ============================================
// Zar30 - POST /api/v1/admin/delivery/:id/deliver
// ============================================
// تحویل نهایی — SHIPPED → DELIVERED + تسویه طلای قفل‌شده — permission: delivery.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { deliverDelivery } from '@/lib/finance/delivery.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DELIVERY_REVIEW)
  const { id } = await ctx.params
  const result = await deliverDelivery(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok({ delivery: result })
})
