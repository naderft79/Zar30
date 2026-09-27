// ============================================
// Zar30 - PATCH /api/v1/admin/users/:id/level
// ============================================
// تغییر سطح احراز هویت — permission: kyc.approve + audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserLevelSchema } from '@/lib/validators/admin'
import { changeUserLevelByAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.KYC_APPROVE)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserLevelSchema)
  const result = await changeUserLevelByAdmin(admin, id, input, getSessionMeta(req))
  return ok({ user: result })
})
