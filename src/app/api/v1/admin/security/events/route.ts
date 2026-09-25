// ============================================
// Zar30 - GET /api/v1/admin/security/events
// ============================================
// رویدادهای امنیتی کاربران (ورود/خروج/نشست/رمز) — security.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminSecurityEventsQuerySchema } from '@/lib/validators/admin-automation'
import { listAdminSecurityEvents } from '@/lib/services/admin-automation.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SECURITY_READ)
  const input = parseAdminQuery(req, adminSecurityEventsQuerySchema)
  const { rows, total } = await listAdminSecurityEvents(input)
  return ok({ events: rows }, paginationMeta(input.page, input.limit, total))
})
