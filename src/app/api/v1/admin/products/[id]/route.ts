// ============================================
// Zar30 - /api/v1/admin/products/:id
// ============================================
// PUT → ویرایش محصول — products.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminProductSchema } from '@/lib/validators/admin-commerce'
import { updateAdminProduct } from '@/lib/services/admin-commerce.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRODUCTS_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminProductSchema)
  const product = await updateAdminProduct(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body,
    getSessionMeta(req),
  )
  return ok({ product })
})
