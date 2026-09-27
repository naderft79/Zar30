// ============================================
// Zar30 - GET/POST /api/v1/admin/users/:id/risk
// ============================================
// رویدادهای ریسک کاربر + افزودن سیگنال دستی
// read: risk.read / write: risk.review + audit
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserRiskSchema } from '@/lib/validators/admin'
import { addUserRiskEventByAdmin, listUserRiskEventsAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.RISK_READ)
  const { id } = await ctx.params
  return ok({ events: await listUserRiskEventsAdmin(id) })
})

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_REVIEW)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserRiskSchema)
  const result = await addUserRiskEventByAdmin(admin, id, input, getSessionMeta(req))
  return created(result)
})
