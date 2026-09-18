// ============================================
// Zarnama - POST /api/v1/auth/login
// ============================================
// Web: tokens در httpOnly cookie — Mobile: tokens در body (Bearer)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { loginSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { setAuthCookies } from '@/lib/auth/cookies'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, loginSchema)
  await checkRateLimit('auth.login', input.mobile)

  const meta = getSessionMeta(req)
  const result = await authService.login(input, meta)

  const res = ok({
    user: result.user,
    accessToken: result.accessToken, // برای Mobile — Web از cookie استفاده می‌کند
    refreshToken: result.refreshToken,
  })
  setAuthCookies(res, result.accessToken, result.refreshToken)
  return res
})
