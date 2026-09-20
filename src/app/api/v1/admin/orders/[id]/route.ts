// ============================================
// Zar30 - GET /api/v1/admin/orders/:id
// ============================================
// جزئیات سفارش + journal/ledger + audit — permission: orders.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminOrderDetail } from '@/lib/services/admin-finance.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.ORDERS_READ)
  const { id } = await ctx.params
  return ok({ order: await getAdminOrderDetail(id) })
})
