// ============================================
// Zar30 - GET /api/v1/users/security-events
// ============================================
// رویدادهای امنیتی اخیر کاربر — از audit_logs
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const events = await userService.listSecurityEvents(auth.userId)
  return ok({ events })
})
