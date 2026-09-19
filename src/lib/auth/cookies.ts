// ============================================
// Zar30 - Auth Cookies (Phase 2)
// ============================================
// Web: httpOnly + Secure + SameSite=Lax
// Mobile: tokens در body (Bearer) — cookie نادیده گرفته می‌شود
// ============================================

import type { NextResponse } from 'next/server'

export const ACCESS_COOKIE = 'zar30_access'
export const REFRESH_COOKIE = 'zar30_refresh'

const isProd = process.env.NODE_ENV === 'production'

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 دقیقه — هم‌راستا با JWT_ACCESS_EXPIRES_IN
  })
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 روز
  })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
