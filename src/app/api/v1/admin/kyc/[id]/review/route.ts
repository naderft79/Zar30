// ============================================
// Zar30 - POST /api/v1/admin/kyc/:id/review
// ============================================
// تصمیم ادمین — approve / reject / request_changes (+reason)
// permission پایه kyc.review؛ approve→kyc.approve، reject→kyc.reject
// اثر مالی: approve → ارتقای kycLevel کاربر؛ همه با strict audit اتمیک
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { kycService } from '@/lib/services/kyc.service'

type Ctx = { params: Promise<{ id: string }> }

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  reason: z.string().trim().max(500).optional(),
})

const DECISION_PERMISSION: Record<'approve' | 'reject' | 'request_changes', Permission> = {
  approve: PERMISSIONS.KYC_APPROVE,
  reject: PERMISSIONS.KYC_REJECT,
  request_changes: PERMISSIONS.KYC_REVIEW,
}

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.KYC_REVIEW)
  const { id } = await ctx.params
  const { decision, reason } = await parseBody(req, reviewSchema)
  // تصمیم نهایی granular است — approve/reject permission جداگانه می‌خواهند
  if (!hasPermission(admin.permissions, DECISION_PERMISSION[decision])) {
    throw ApiError.forbidden('دسترسی لازم برای این عملیات را ندارید')
  }
  const submission = await kycService.review(
    admin.adminId,
    admin.adminRole,
    id,
    decision,
    reason,
    getSessionMeta(req),
  )
  return ok({ submission })
})
