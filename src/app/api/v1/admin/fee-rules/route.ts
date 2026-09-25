// ============================================
// Zar30 - /api/v1/admin/fee-rules
// ============================================
// GET  → لیست قواعد کارمزد گروهی — pricing.read
// POST → ایجاد قانون — pricing.update
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminFeeRuleSchema } from '@/lib/validators/admin-commerce'
import { listAdminFeeRules, upsertAdminFeeRule } from '@/lib/services/admin-fees.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)
  const rows = await listAdminFeeRules()
  return ok({ rules: rows })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const body = await parseBody(req, adminFeeRuleSchema)
  const result = await upsertAdminFeeRule(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
