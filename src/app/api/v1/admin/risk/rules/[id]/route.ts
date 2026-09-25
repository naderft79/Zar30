// ============================================
// Zar30 - /api/v1/admin/risk/rules/:id
// ============================================
// PUT    → ویرایش قانون — risk.manage_rules
// DELETE → حذف قانون — risk.manage_rules
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRiskRuleSchema } from '@/lib/validators/admin-risk'
import { deleteAdminRiskRule, upsertAdminRiskRule } from '@/lib/services/admin-risk.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_MANAGE_RULES)
  const { id } = await ctx.params
  const body = await parseBody(req, adminRiskRuleSchema)
  const result = await upsertAdminRiskRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_MANAGE_RULES)
  const { id } = await ctx.params
  const result = await deleteAdminRiskRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
