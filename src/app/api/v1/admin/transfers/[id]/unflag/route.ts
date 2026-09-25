// ============================================
// Zar30 - POST /api/v1/admin/transfers/:id/unflag
// ============================================
// برداشتن پرچم تقلب — permission: transfers.flag
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { setTransferFlag } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.TRANSFERS_FLAG)
  const { id } = await ctx.params
  const result = await setTransferFlag(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    false,
    undefined,
    getSessionMeta(req),
  )
  return ok(result)
})
