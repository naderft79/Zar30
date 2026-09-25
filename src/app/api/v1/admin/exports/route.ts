// ============================================
// Zar30 - GET /api/v1/admin/exports
// ============================================
// تاریخچه خروجی‌ها — reports.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminExportsQuerySchema } from '@/lib/validators/admin-risk'
import { listAdminExports } from '@/lib/services/admin-reports.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.REPORTS_READ)
  const input = parseAdminQuery(req, adminExportsQuerySchema)
  const { rows, total } = await listAdminExports(input.page, input.limit)
  return ok({ exports: rows }, paginationMeta(input.page, input.limit, total))
})
