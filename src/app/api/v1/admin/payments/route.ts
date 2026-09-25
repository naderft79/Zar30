// ============================================
// Zar30 - GET /api/v1/admin/payments
// ============================================
// لیست تراکنش‌های درگاه — permission: payments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminPaymentListQuerySchema } from '@/lib/validators/admin-ops'
import { listAdminPayments } from '@/lib/services/admin-ops.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PAYMENTS_READ)
  const input = parseAdminQuery(req, adminPaymentListQuerySchema)
  const { rows, total } = await listAdminPayments(input)
  return ok({ payments: rows }, paginationMeta(input.page, input.limit, total))
})
