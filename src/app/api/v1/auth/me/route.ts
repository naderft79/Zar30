// ============================================
// Zar30 - GET /api/v1/auth/me
// ============================================
// پروفایل کاربر جاری — نیازمند احراز هویت
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { authService } from '@/lib/services/auth.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const user = await authService.getProfile(auth.userId)
  return ok({ user })
})
