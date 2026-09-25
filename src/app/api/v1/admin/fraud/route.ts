// ============================================
// Zar30 - GET /api/v1/admin/fraud
// ============================================
// سیگنال‌های تقلب — انتقال‌های پرچم‌دار + کارت‌های مسدود — fraud.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminFraudQuerySchema } from '@/lib/validators/admin-risk'
import { listAdminFraudSignals } from '@/lib/services/admin-risk.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.FRAUD_READ)
  const input = parseAdminQuery(req, adminFraudQuerySchema)
  const { rows, total } = await listAdminFraudSignals(input)
  return ok({ signals: rows }, paginationMeta(input.page, input.limit, total))
})
