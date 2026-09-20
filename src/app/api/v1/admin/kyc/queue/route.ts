// ============================================
// Zar30 - GET /api/v1/admin/kyc/queue
// ============================================
// صف بررسی KYC — فقط ادمین فعال
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin(req)
  const queue = await kycService.reviewQueue()
  return ok({ queue })
})
