// ============================================
// Zar30 - /api/v1/users/sessions
// ============================================
// GET    — نشست‌های فعال با device/browser/isCurrent
// DELETE — خروج همه نشست‌های دیگر (نشست جاری حفظ می‌شود)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const sessions = await userService.listUserSessions(auth.userId, auth.sessionId)
  return ok({ sessions })
})

// Logout All — لغو همه نشست‌های دیگر (نشست جاری حفظ می‌شود)
export const DELETE = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const meta = getSessionMeta(req)
  const result = await userService.revokeOtherSessions(auth.userId, auth.sessionId, meta)
  return ok(result)
})
