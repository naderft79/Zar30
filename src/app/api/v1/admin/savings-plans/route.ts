// ============================================
// Zar30 - GET /api/v1/admin/savings-plans
// ============================================
// لیست طرح‌های خرید خودکار کاربران — savings.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminSipListQuerySchema } from '@/lib/validators/admin-automation'
import { listAdminSavingsPlans } from '@/lib/services/admin-automation.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SIP_READ)
  const input = parseAdminQuery(req, adminSipListQuerySchema)
  const { rows, total } = await listAdminSavingsPlans(input)
  return ok({ plans: rows }, paginationMeta(input.page, input.limit, total))
})
