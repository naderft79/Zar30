// ============================================
// Zar30 - GET /api/v1/admin/price-alerts
// ============================================
// لیست هشدارهای قیمت کاربران — read-only — alerts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminAlertListQuerySchema } from '@/lib/validators/admin-automation'
import { listAdminPriceAlerts } from '@/lib/services/admin-automation.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.ALERTS_READ)
  const input = parseAdminQuery(req, adminAlertListQuerySchema)
  const { rows, total } = await listAdminPriceAlerts(input)
  return ok({ alerts: rows }, paginationMeta(input.page, input.limit, total))
})
