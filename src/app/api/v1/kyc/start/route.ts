// ============================================
// Zar30 - POST /api/v1/kyc/start
// ============================================
// شروع/ادامه draft احراز هویت — idempotent
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAuth } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const submission = await kycService.start(auth.userId, getSessionMeta(req))
  return ok({ submission })
})
