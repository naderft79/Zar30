// ============================================
// Zar30 - PATCH /api/v1/admin/users/:id/credit
// ============================================
// تنظیم امتیاز اعتباری — permission: risk.review + audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserCreditSchema } from '@/lib/validators/admin'
import { setUserCreditByAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_REVIEW)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserCreditSchema)
  const result = await setUserCreditByAdmin(admin, id, input, getSessionMeta(req))
  return ok({ user: result })
})
