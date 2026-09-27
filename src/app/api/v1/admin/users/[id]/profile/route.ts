// ============================================
// Zar30 - GET/PATCH /api/v1/admin/users/:id/profile
// ============================================
// مشخصات پایه کاربر — read: users.read / write: users.update + audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserProfileSchema } from '@/lib/validators/admin'
import { getUserProfileAdmin, updateUserProfileByAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.USERS_READ)
  const { id } = await ctx.params
  return ok({ profile: await getUserProfileAdmin(id) })
})

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.USERS_UPDATE)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserProfileSchema)
  const result = await updateUserProfileByAdmin(admin, id, input, getSessionMeta(req))
  return ok({ user: result })
})
