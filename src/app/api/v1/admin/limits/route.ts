// ============================================
// Zar30 - /api/v1/admin/limits
// ============================================
// GET  → لیست قوانین محدودیت (فیلتر scope) — limits.read
// POST → ایجاد قانون — limits.manage
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminLimitListQuerySchema, adminLimitRuleSchema } from '@/lib/validators/admin-commerce'
import { listAdminLimitRules, upsertAdminLimitRule } from '@/lib/services/admin-fees.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LIMITS_READ)
  const input = parseAdminQuery(req, adminLimitListQuerySchema)
  const { rows, total } = await listAdminLimitRules(input)
  return ok({ rules: rows }, paginationMeta(input.page, input.limit, total))
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.LIMITS_MANAGE)
  const body = await parseBody(req, adminLimitRuleSchema)
  const result = await upsertAdminLimitRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
