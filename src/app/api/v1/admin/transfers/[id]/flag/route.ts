// ============================================
// Zar30 - POST /api/v1/admin/transfers/:id/flag
// ============================================
// پرچم تقلب روی انتقال — permission: transfers.flag
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminFlagSchema } from '@/lib/validators/admin-ops'
import { setTransferFlag } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.TRANSFERS_FLAG)
  const { id } = await ctx.params
  const body = await parseBody(req, adminFlagSchema)
  const result = await setTransferFlag(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    true,
    body.reason,
    getSessionMeta(req),
  )
  return ok(result)
})
