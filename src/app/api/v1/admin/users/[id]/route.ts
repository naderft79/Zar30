// ============================================
// Zar30 - GET /api/v1/admin/users/:id
// ============================================
// جزئیات کاربر — بخش‌ها بر اساس permission ادمین فیلتر می‌شوند — permission: users.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminUserDetail } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.USERS_READ)
  const { id } = await ctx.params
  const detail = await getAdminUserDetail(id, admin.permissions)
  return ok({ user: detail })
})
