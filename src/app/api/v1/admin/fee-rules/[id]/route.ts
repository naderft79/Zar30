// ============================================
// Zar30 - /api/v1/admin/fee-rules/:id
// ============================================
// PUT    → ویرایش قانون — pricing.update
// DELETE → حذف قانون — pricing.update
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminFeeRuleSchema } from '@/lib/validators/admin-commerce'
import { deleteAdminFeeRule, upsertAdminFeeRule } from '@/lib/services/admin-fees.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminFeeRuleSchema)
  const result = await upsertAdminFeeRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const { id } = await ctx.params
  const result = await deleteAdminFeeRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
