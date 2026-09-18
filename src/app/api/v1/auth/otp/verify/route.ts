// ============================================
// Zarnama - POST /api/v1/auth/otp/verify
// ============================================
// فعلاً فقط برای تایید ثبت‌نام استفاده می‌شود
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { otpVerifySchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, otpVerifySchema)
  await checkRateLimit('otp.verify', input.mobile)

  if (input.purpose === 'register') {
    const meta = getSessionMeta(req)
    const result = await authService.verifyRegisterOtp(input.mobile, input.code, meta)
    return ok(result)
  }

  // purpose=login/reset در جریان login/reset-password خودشان verify می‌کنند
  return ok({ verified: false })
})
