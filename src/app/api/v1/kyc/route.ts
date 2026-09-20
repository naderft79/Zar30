// ============================================
// Zar30 - GET /api/v1/kyc
// ============================================
// وضعیت KYC کاربر جاری — سطح، submission فعال، تاریخچه
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const status = await kycService.getStatus(auth.userId)
  return ok(status)
})
