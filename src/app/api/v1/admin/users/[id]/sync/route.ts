// ============================================
// Zar30 - POST /api/v1/admin/users/:id/sync
// ============================================
// همگام‌سازی موجودی با دفتر کل — permission: wallets.freeze (اقدام حساس مالی)
// audit: user.orders.sync
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { syncUserOrdersAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.WALLETS_FREEZE)
  const { id } = await ctx.params
  const result = await syncUserOrdersAdmin(admin, id, getSessionMeta(req))
  return ok(result)
})
