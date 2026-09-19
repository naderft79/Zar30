// ============================================
// Zar30 - POST /api/v1/auth/password/forgot
// ============================================
// درخواست بازیابی رمز — پاسخ همیشه یکسان (ضد user enumeration)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getClientIp } from '@/lib/api/request'
import { forgotPasswordSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, forgotPasswordSchema)
  await checkRateLimit('auth.password_reset', input.mobile)
  await checkRateLimit('api.general', getClientIp(req) ?? 'unknown')

  const result = await authService.requestPasswordReset(input.mobile)
  return ok(result)
})
