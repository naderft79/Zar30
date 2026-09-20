// ============================================
// Zar30 - PUT /api/v1/kyc/draft
// ============================================
// ذخیره میان‌مرحله‌ای draft — فقط در وضعیت IN_PROGRESS
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAuth } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

export const PUT = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const body = await req.json().catch(() => null)
  const submission = await kycService.updateDraft(auth.userId, body, getSessionMeta(req))
  return ok({ submission })
})
