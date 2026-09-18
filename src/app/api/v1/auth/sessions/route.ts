// ============================================
// Zarnama - GET /api/v1/auth/sessions
// ============================================
// لیست Sessionهای فعال کاربر — نیازمند احراز هویت
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { authService } from '@/lib/services/auth.service'
import { requireAuth } from '@/lib/auth/guard'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const sessions = await authService.listSessions(auth.userId)
  return ok({ sessions })
})
