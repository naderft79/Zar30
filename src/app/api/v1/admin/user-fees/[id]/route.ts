// ============================================
// Zar30 - /api/v1/admin/user-fees/:id
// ============================================
// DELETE → حذف override فردی — pricing.update
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { deleteAdminUserFee } from '@/lib/services/admin-fees.service'

type Ctx = { params: Promise<{ id: string }> }

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const { id } = await ctx.params
  const result = await deleteAdminUserFee(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
