// ============================================
// Zar30 - POST /api/v1/admin/kyc/:id/claim
// ============================================
// گرفتن پرونده برای بررسی — SUBMITTED → UNDER_REVIEW — permission: kyc.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { kycService } from '@/lib/services/kyc.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.KYC_REVIEW)
  const { id } = await ctx.params
  const submission = await kycService.claim(admin.adminId, admin.adminRole, id, getSessionMeta(req))
  return ok({ submission })
})
