// ============================================
// Zar30 - GET /api/v1/admin/users/:id/deliveries
// ============================================
// درخواست‌های تحویل فیزیکی کاربر — permission: delivery.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listUserDeliveriesAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.DELIVERY_READ)
  const { id } = await ctx.params
  return ok({ deliveries: await listUserDeliveriesAdmin(id) })
})
