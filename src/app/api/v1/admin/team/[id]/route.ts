// ============================================
// Zar30 - /api/v1/admin/team/:id
// ============================================
// GET → جزئیات عضو + permissionهای resolve‌شده — team.read
// PUT → نقش/فعلیت/override — team.manage + دلیل اجباری
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminMemberUpdateSchema } from '@/lib/validators/admin-system'
import { getAdminMember, updateAdminMember } from '@/lib/services/admin-system.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.TEAM_READ)
  const { id } = await ctx.params
  const member = await getAdminMember(id)
  return ok({ member })
})

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.TEAM_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminMemberUpdateSchema)
  const result = await updateAdminMember(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body,
    getSessionMeta(req),
  )
  return ok(result)
})
