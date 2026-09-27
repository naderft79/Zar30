// ============================================
// Zar30 - /api/v1/referrals
// ============================================
// GET → آمار دعوت کاربر (کد، لیست دعوت‌شدگان، پاداش‌ها)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { getReferralStats } from '@/lib/services/referral.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const stats = await getReferralStats(auth.userId)
  return ok(stats)
})
