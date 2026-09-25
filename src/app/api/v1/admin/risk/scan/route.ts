// ============================================
// Zar30 - POST /api/v1/admin/risk/scan
// ============================================
// اسکن دستی کاربران فعال ۲۴h اخیر در برابر قوانین ریسک — risk.manage_rules
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { runAdminRiskScan } from '@/lib/services/admin-risk.service'

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_MANAGE_RULES)
  const result = await runAdminRiskScan(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    getSessionMeta(req),
  )
  return ok(result)
})
