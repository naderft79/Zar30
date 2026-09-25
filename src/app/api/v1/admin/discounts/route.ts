// ============================================
// Zar30 - /api/v1/admin/discounts
// ============================================
// GET  → لیست کدهای تخفیف — discounts.read
// POST → ایجاد کد تخفیف — discounts.manage
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminDiscountListQuerySchema, adminDiscountSchema } from '@/lib/validators/admin-commerce'
import { listAdminDiscounts, upsertAdminDiscount } from '@/lib/services/admin-commerce.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DISCOUNTS_READ)
  const input = parseAdminQuery(req, adminDiscountListQuerySchema)
  const { rows, total } = await listAdminDiscounts(input)
  return ok({ discounts: rows }, paginationMeta(input.page, input.limit, total))
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DISCOUNTS_MANAGE)
  const body = await parseBody(req, adminDiscountSchema)
  const result = await upsertAdminDiscount(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
