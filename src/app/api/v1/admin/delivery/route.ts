// ============================================
// Zar30 - GET /api/v1/admin/delivery
// ============================================
// لیست درخواست‌های تحویل فیزیکی — permission: delivery.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminDeliveryListQuerySchema } from '@/lib/validators/admin-delivery'
import { listAdminDeliveries } from '@/lib/services/admin-delivery.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DELIVERY_READ)
  const input = parseAdminQuery(req, adminDeliveryListQuerySchema)
  const { rows, total } = await listAdminDeliveries(input)
  return ok({ deliveries: rows }, paginationMeta(input.page, input.limit, total))
})
