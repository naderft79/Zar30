// ============================================
// Zar30 - POST /api/v1/admin/kyc/:id/review
// ============================================
// تصمیم ادمین — approve / reject / request_changes (+reason)
// اثر مالی: approve → ارتقای kycLevel کاربر؛ همه با AuditLog
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdmin } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

type Ctx = { params: Promise<{ id: string }> }

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  reason: z.string().trim().max(500).optional(),
})

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req)
  const { id } = await ctx.params
  const { decision, reason } = await parseBody(req, reviewSchema)
  const submission = await kycService.review(
    admin.adminId,
    id,
    decision,
    reason,
    getSessionMeta(req),
  )
  return ok({ submission })
})
