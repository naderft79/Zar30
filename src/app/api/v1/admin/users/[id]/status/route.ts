// ============================================
// Zar30 - PATCH /api/v1/admin/users/:id/status
// ============================================
// تغییر وضعیت ACTIVE/BLOCKED — اتمیک: status + revoke sessions + notification + strict audit
// permission: users.status — DELETED از این API مجاز نیست
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserStatusSchema } from '@/lib/validators/admin'
import { changeAdminUserStatus } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.USERS_STATUS)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserStatusSchema)
  const result = await changeAdminUserStatus(admin, id, input, getSessionMeta(req))
  return ok({ user: result })
})
