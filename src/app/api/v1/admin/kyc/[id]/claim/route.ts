// ============================================
// Zar30 - POST /api/v1/admin/kyc/:id/claim
// ============================================
// گرفتن پرونده برای بررسی — SUBMITTED → UNDER_REVIEW
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdmin } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req)
  const { id } = await ctx.params
  const submission = await kycService.claim(admin.adminId, id, getSessionMeta(req))
  return ok({ submission })
})
