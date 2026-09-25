// ============================================
// Zar30 - POST /api/v1/admin/savings-plans/:id/toggle
// ============================================
// توقف/فعال‌سازی طرح خرید خودکار — savings.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminSipToggleSchema } from '@/lib/validators/admin-automation'
import { setAdminSavingsPlanActive } from '@/lib/services/admin-automation.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SIP_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminSipToggleSchema)
  const result = await setAdminSavingsPlanActive(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body.active,
    getSessionMeta(req),
    body.reason,
  )
  return ok(result)
})
