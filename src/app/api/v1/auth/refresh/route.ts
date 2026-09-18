// ============================================
// Zarnama - POST /api/v1/auth/refresh
// ============================================
// Refresh rotation + reuse detection
// token از httpOnly cookie (Web) یا body (Mobile)
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { rotateSession } from '@/lib/auth/session'
import { REFRESH_COOKIE, setAuthCookies } from '@/lib/auth/cookies'
import { signAccessToken } from '@/lib/auth/jwt'
import { ApiError } from '@/lib/errors/api-error'
import prisma from '@/lib/db/prisma'

const refreshSchema = z.object({ refreshToken: z.string().min(10).optional() })

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
    .then((json) => refreshSchema.safeParse(json))
    .catch(() => null)
  const bodyToken = body?.success ? body.data.refreshToken : undefined

  const token = bodyToken ?? extractRefreshCookie(req)
  if (!token) {
    throw ApiError.unauthorized('توکن refresh ارسال نشده است')
  }

  const meta = getSessionMeta(req)
  const rotated = await rotateSession(token, meta)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: rotated.userId } })
  const accessToken = await signAccessToken({
    sub: user.id,
    mobile: user.mobile,
    kycLevel: user.kycLevel,
    sid: rotated.sessionId,
  })

  const res = ok({ accessToken, refreshToken: rotated.refreshToken })
  setAuthCookies(res, accessToken, rotated.refreshToken)
  return res
})
