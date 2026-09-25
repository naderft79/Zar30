// ============================================
// Zar30 - /api/v1/admin/rate-limits/:id
// ============================================
// PUT    → ویرایش قانون — ratelimit.manage
// DELETE → حذف قانون (به fallback برمی‌گردد) — ratelimit.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRateLimitSchema } from '@/lib/validators/admin-automation'
import { deleteAdminRateLimit, upsertAdminRateLimit } from '@/lib/services/admin-automation.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RATELIMIT_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminRateLimitSchema)
  const result = await upsertAdminRateLimit(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RATELIMIT_MANAGE)
  const { id } = await ctx.params
  const result = await deleteAdminRateLimit(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
