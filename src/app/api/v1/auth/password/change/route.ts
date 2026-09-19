// ============================================
// Zar30 - POST /api/v1/auth/password/change
// ============================================
// تغییر رمز با احراز هویت — Sessionهای دیگر revoke می‌شوند
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { changePasswordSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { requireAuth } from '@/lib/auth/guard'
import { REFRESH_COOKIE } from '@/lib/auth/cookies'
import { verifyRefreshToken } from '@/lib/auth/jwt'

function extractRefreshCookie(req: Request): string | undefined {
  const raw = req.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REFRESH_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=')
  return raw ? decodeURIComponent(raw) : undefined
}

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const input = await parseBody(req, changePasswordSchema)

  // Session جاری از refresh token شناسایی می‌شود تا حفظ شود
  let currentSessionId: string | undefined
  const refreshToken = extractRefreshCookie(req)
  if (refreshToken) {
    try {
      currentSessionId = (await verifyRefreshToken(refreshToken)).sid
    } catch {
      currentSessionId = undefined
    }
  }

  const meta = { ...getSessionMeta(req), currentSessionId }
  const result = await authService.changePassword(auth.userId, input, meta)
  return ok(result)
})
