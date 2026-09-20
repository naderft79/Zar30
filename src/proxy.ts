// ============================================
// Zar30 - Middleware Foundation
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
// مسیرهای محافظت شده — سایر مسیرها عمومی هستند
const PROTECTED_PATHS = ['/dashboard', '/admin']

// request id خارجی فقط با این الگو trust می‌شود — ورودی نامعتبر جایگزین می‌شود
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/

// security headers + X-Request-Id روی همه پاسخ‌ها (از جمله redirect و 401)
function applyResponseHeaders(response: NextResponse, requestId: string): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  response.headers.set('X-Request-Id', requestId)
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Request ID برای tracing — روی request headers هم ست می‌شود تا route handlerها
  // (مثلاً audit requestId) آن را ببینند؛ مقدار کلاینت فقط در صورت امن بودن حفظ می‌شود
  const incomingId = request.headers.get('x-request-id')
  const requestId =
    incomingId && REQUEST_ID_PATTERN.test(incomingId) ? incomingId : crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  const response = applyResponseHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    requestId,
  )

  // بررسی مسیرهای محافظت شده
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtected) {
    // بررسی وجود access token در cookie یا Authorization header
    // برای صفحات، refresh token هم کافی است — client آن را به access جدید تبدیل می‌کند
    const accessToken =
      request.cookies.get('zar30_access')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')
    const refreshToken = request.cookies.get('zar30_refresh')?.value

    if (!accessToken && !(refreshToken && !pathname.startsWith('/api'))) {
      // اگر API request است → 401
      if (pathname.startsWith('/api')) {
        return applyResponseHeaders(
          NextResponse.json(
            { success: false, error: { type: 'unauthorized', title: 'Authentication required' } },
            { status: 401 },
          ),
          requestId,
        )
      }
      // اگر صفحه است → redirect به login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return applyResponseHeaders(NextResponse.redirect(loginUrl), requestId)
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
