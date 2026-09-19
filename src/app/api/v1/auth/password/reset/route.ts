// ============================================
// Zar30 - POST /api/v1/auth/password/reset
// ============================================
// تنظیم رمز جدید با OTP — همه Sessionها revoke می‌شوند
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { resetPasswordSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, resetPasswordSchema)
  await checkRateLimit('otp.verify', input.mobile)

  const meta = getSessionMeta(req)
  const result = await authService.resetPassword(input, meta)
  return ok(result)
})
