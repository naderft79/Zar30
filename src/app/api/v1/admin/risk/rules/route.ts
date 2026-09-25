// ============================================
// Zar30 - /api/v1/admin/risk/rules
// ============================================
// GET  → لیست قوانین ریسک — risk.read
// POST → ایجاد قانون — risk.manage_rules
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRiskRuleSchema } from '@/lib/validators/admin-risk'
import { listAdminRiskRules, upsertAdminRiskRule } from '@/lib/services/admin-risk.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.RISK_READ)
  const rules = await listAdminRiskRules()
  return ok({ rules })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_MANAGE_RULES)
  const body = await parseBody(req, adminRiskRuleSchema)
  const result = await upsertAdminRiskRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
