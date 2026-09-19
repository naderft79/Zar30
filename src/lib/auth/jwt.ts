// ============================================
// Zar30 - JWT (jose) — Access + Refresh (Phase 2)
// ============================================
// Web: httpOnly cookie — Mobile: Bearer header
// هر دو به همان /api/v1/auth متصل‌اند (هم‌دامنه Auth)
// ============================================

import { SignJWT, jwtVerify } from 'jose'
import { env } from '@/lib/config/env'

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

export interface AccessTokenPayload {
  sub: string
  mobile: string
  kycLevel: string
  /** شناسه Session — برای بررسی revocation در هر request */
  sid: string
}

export interface RefreshTokenPayload {
  sub: string
  /** شناسه Session در DB — برای rotation و revocation */
  sid: string
  jti: string
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ mobile: payload.mobile, kycLevel: payload.kycLevel, sid: payload.sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessSecret)
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ sid: payload.sid, jti: payload.jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  })
  if (!payload.sub) throw new Error('Invalid token payload')
  return {
    sub: payload.sub,
    mobile: String(payload.mobile ?? ''),
    kycLevel: String(payload.kycLevel ?? ''),
    sid: String(payload.sid ?? ''),
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  })
  if (!payload.sub || !payload.sid) throw new Error('Invalid token payload')
  return {
    sub: payload.sub,
    sid: String(payload.sid),
    jti: String(payload.jti ?? ''),
  }
}
