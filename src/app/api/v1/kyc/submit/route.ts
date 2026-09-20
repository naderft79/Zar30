// ============================================
// Zar30 - POST /api/v1/kyc/submit
// ============================================
// ارسال نهایی — کامل‌بودن همه مراحل server-side بررسی می‌شود
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAuth } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const submission = await kycService.submit(auth.userId, getSessionMeta(req))
  return ok({ submission })
})
