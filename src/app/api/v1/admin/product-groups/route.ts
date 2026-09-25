// ============================================
// Zar30 - /api/v1/admin/product-groups
// ============================================
// GET  → لیست دسته‌بندی‌ها — products.read
// POST → ایجاد دسته‌بندی — products.manage
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminCategoryListQuerySchema, adminCategorySchema } from '@/lib/validators/admin-commerce'
import { listAdminCategories, upsertAdminCategory } from '@/lib/services/admin-commerce.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRODUCTS_READ)
  const input = parseAdminQuery(req, adminCategoryListQuerySchema)
  const { rows, total } = await listAdminCategories(input)
  return ok({ categories: rows }, paginationMeta(input.page, input.limit, total))
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRODUCTS_MANAGE)
  const body = await parseBody(req, adminCategorySchema)
  const result = await upsertAdminCategory(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
