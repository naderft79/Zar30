// ============================================
// Zar30 - /api/v1/admin/products
// ============================================
// GET  → لیست محصولات فروشگاه — products.read
// POST → ایجاد محصول — products.manage
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminProductListQuerySchema, adminProductSchema } from '@/lib/validators/admin-commerce'
import { createAdminProduct, listAdminProducts } from '@/lib/services/admin-commerce.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRODUCTS_READ)
  const input = parseAdminQuery(req, adminProductListQuerySchema)
  const { rows, total } = await listAdminProducts(input)
  return ok({ products: rows }, paginationMeta(input.page, input.limit, total))
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRODUCTS_MANAGE)
  const body = await parseBody(req, adminProductSchema)
  const product = await createAdminProduct(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created({ product })
})
