// ============================================
// Zar30 - PUT /api/v1/users/profile
// ============================================
// به‌روزرسانی profile کاربر جاری — نیازمند احراز هویت
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { profileUpdateSchema } from '@/lib/validators/users'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const PUT = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const input = await parseBody(req, profileUpdateSchema)
  const meta = getSessionMeta(req)
  const user = await userService.updateProfile(auth.userId, input, meta)
  return ok({ user })
})
