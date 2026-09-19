// ============================================
// Zar30 - GET /api/v1/users/me
// ============================================
// پروفایل کامل کاربر جاری — نیازمند احراز هویت
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const user = await userService.getUserProfile(auth.userId)
  return ok({ user })
})
