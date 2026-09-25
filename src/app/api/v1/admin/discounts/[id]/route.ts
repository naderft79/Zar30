// ============================================
// Zar30 - /api/v1/admin/discounts/:id
// ============================================
// PUT → ویرایش کد تخفیف — discounts.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminDiscountSchema } from '@/lib/validators/admin-commerce'
import { upsertAdminDiscount } from '@/lib/services/admin-commerce.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DISCOUNTS_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminDiscountSchema)
  const result = await upsertAdminDiscount(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})
