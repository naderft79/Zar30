// ============================================
// Zar30 - GET /api/v1/users/notifications
// ============================================
// لیست اعلان‌های کاربر — architecture برای Notification Engine بعدی
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const notifications = await userService.listNotifications(auth.userId)
  return ok({ notifications })
})
