// ============================================
// Zarnama - POST /api/v1/auth/logout
// ============================================
// Session جاری revoke می‌شود — عمل idempotent است
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { authService } from '@/lib/services/auth.service'
import { REFRESH_COOKIE, clearAuthCookies } from '@/lib/auth/cookies'
import { verifyRefreshToken } from '@/lib/auth/jwt'

const logoutSchema = z.object({ refreshToken: z.string().min(10).optional() })

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
  const body = await req
    .json()
    .then((json) => logoutSchema.safeParse(json))
    .catch(() => null)
  const bodyToken = body?.success ? body.data.refreshToken : undefined
  const token = bodyToken ?? extractRefreshCookie(req)

  // Session از refresh token شناسایی و revoke می‌شود — بدون token هم logout موفق است
  if (token) {
    try {
      const payload = await verifyRefreshToken(token)
      const meta = getSessionMeta(req)
      await authService.logout(payload.sid, payload.sub, meta)
    } catch {
      // token نامعتبر — فقط cookieها پاک می‌شوند
    }
  }

  const res = ok({ loggedOut: true })
  clearAuthCookies(res)
  return res
})
