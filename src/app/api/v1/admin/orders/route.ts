// ============================================
// Zar30 - GET /api/v1/admin/orders
// ============================================
// لیست سفارش‌ها — read-only — permission: orders.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminOrderListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminOrders } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.ORDERS_READ)
  const parsed = adminOrderListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminOrders(parsed.data)
  const { page, limit } = parsed.data
  return ok({ orders: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})
