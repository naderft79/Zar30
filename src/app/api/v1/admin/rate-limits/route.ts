// ============================================
// Zar30 - /api/v1/admin/rate-limits
// ============================================
// GET  → لیست قوانین rate limit — ratelimit.read
// POST → ایجاد قانون — ratelimit.manage
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRateLimitSchema } from '@/lib/validators/admin-automation'
import { listAdminRateLimits, upsertAdminRateLimit } from '@/lib/services/admin-automation.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.RATELIMIT_READ)
  const rows = await listAdminRateLimits()
  return ok({ rules: rows })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RATELIMIT_MANAGE)
  const body = await parseBody(req, adminRateLimitSchema)
  const result = await upsertAdminRateLimit(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
