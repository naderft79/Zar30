// ============================================
// Zar30 - DELETE /api/v1/admin/settings/:key
// ============================================
// حذف تنظیم — settings.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { deleteAdminSetting } from '@/lib/services/admin-system.service'

type Ctx = { params: Promise<{ key: string }> }

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SETTINGS_MANAGE)
  const { key } = await ctx.params
  const result = await deleteAdminSetting(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    decodeURIComponent(key),
    getSessionMeta(req),
  )
  return ok(result)
})
