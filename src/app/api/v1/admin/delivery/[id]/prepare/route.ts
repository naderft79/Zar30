// ============================================
// Zar30 - POST /api/v1/admin/delivery/:id/prepare
// ============================================
// شروع آماده‌سازی — APPROVED → PREPARING — permission: delivery.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { prepareDelivery } from '@/lib/finance/delivery.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DELIVERY_REVIEW)
  const { id } = await ctx.params
  const result = await prepareDelivery(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok({ delivery: result })
})
