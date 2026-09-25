// ============================================
// Zar30 - POST /api/v1/admin/risk/events/:id/review
// ============================================
// علامت‌گذاری رویداد به‌عنوان بررسی‌شده — risk.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminRiskReviewSchema } from '@/lib/validators/admin-risk'
import { reviewAdminRiskEvent } from '@/lib/services/admin-risk.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.RISK_REVIEW)
  const { id } = await ctx.params
  const body = await parseBody(req, adminRiskReviewSchema)
  const result = await reviewAdminRiskEvent(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body.note,
    getSessionMeta(req),
  )
  return ok(result)
})
