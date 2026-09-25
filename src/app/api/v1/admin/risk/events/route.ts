// ============================================
// Zar30 - GET /api/v1/admin/risk/events
// ============================================
// رویدادهای ریسک — risk.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRiskEventsQuerySchema } from '@/lib/validators/admin-risk'
import { listAdminRiskEvents } from '@/lib/services/admin-risk.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.RISK_READ)
  const input = parseAdminQuery(req, adminRiskEventsQuerySchema)
  const { rows, total } = await listAdminRiskEvents(input)
  return ok({ events: rows }, paginationMeta(input.page, input.limit, total))
})
