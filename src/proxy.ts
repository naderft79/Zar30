// ============================================
// Zarnama - Middleware Foundation
// ============================================
// Authentication + Rate Limiting + Security Headers
// ============================================

import { NextRequest, NextResponse } from 'next/server'

// Security headers برای همه پاسخ‌ها
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// مسیرهای عمومی (بدون نیاز به احراز هویت)
const PUBLIC_PATHS = [
  '/',
  '/api/v1/health',
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/otp/send',
  '/api/v1/auth/otp/verify',
  '/api/v1/auth/refresh',
  '/api/v1/auth/password/forgot',
  '/api/v1/auth/password/reset',
  '/api/v1/price',
  '/api/v1/price/history',
]

// مسیرهای محافظت شده
const PROTECTED_PATHS = ['/dashboard', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // اضافه کردن security headers به همه پاسخ‌ها
  const response = NextResponse.next()

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // Request ID برای tracing
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-Id', requestId)

  // بررسی مسیرهای محافظت شده
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtected) {
    // بررسی وجود access token در cookie یا Authorization header
    const accessToken =
      request.cookies.get('zarnama_access')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      // اگر API request است → 401
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: { type: 'unauthorized', title: 'Authentication required' } },
          { status: 401 },
        )
      }
      // اگر صفحه است → redirect به login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
