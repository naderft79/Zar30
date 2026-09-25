// ============================================
// Zar30 - POST /api/v1/admin/delivery/:id/ship
// ============================================
// ارسال/زمان‌بندی — PREPARING → SHIPPED — permission: delivery.review
// POST → trackingCode | PICKUP → pickupBranch + pickupAt
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminDeliveryShipSchema } from '@/lib/validators/admin-delivery'
import { shipDelivery } from '@/lib/finance/delivery.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DELIVERY_REVIEW)
  const { id } = await ctx.params
  const body = await parseBody(req, adminDeliveryShipSchema)
  const result = await shipDelivery(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    {
      trackingCode: body.trackingCode,
      pickupBranch: body.pickupBranch,
      pickupAt: body.pickupAt ? new Date(body.pickupAt) : undefined,
    },
    getSessionMeta(req),
  )
  return ok({ delivery: result })
})
