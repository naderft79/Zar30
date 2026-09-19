// ============================================
// Zar30 - POST /api/v1/auth/otp/send
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getClientIp } from '@/lib/api/request'
import { otpSendSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, otpSendSchema)
  // Rate limit per mobile (از RateLimitConfig) + per IP
  await checkRateLimit('otp.send', input.mobile)
  await checkRateLimit('api.general', getClientIp(req) ?? 'unknown')

  const result = await authService.requestOtp(input)
  return ok(result)
})
