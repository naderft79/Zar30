// ============================================
// Zar30 - /api/v1/admin/limits/:id
// ============================================
// PUT    → ویرایش قانون — limits.manage
// DELETE → حذف قانون — limits.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminLimitRuleSchema } from '@/lib/validators/admin-commerce'
import { deleteAdminLimitRule, upsertAdminLimitRule } from '@/lib/services/admin-fees.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.LIMITS_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminLimitRuleSchema)
  const result = await upsertAdminLimitRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.LIMITS_MANAGE)
  const { id } = await ctx.params
  const result = await deleteAdminLimitRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
