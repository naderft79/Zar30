// ============================================
// Zar30 - /api/v1/admin/product-groups/:id
// ============================================
// PUT → ویرایش دسته‌بندی — products.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminCategorySchema } from '@/lib/validators/admin-commerce'
import { upsertAdminCategory } from '@/lib/services/admin-commerce.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRODUCTS_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminCategorySchema)
  const result = await upsertAdminCategory(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})
