// ============================================
// Zar30 - /api/v1/auth/otp/financial
// ============================================
// POST → ارسال OTP مالی به موبایل خود کاربر لاگین‌شده
//        برای انتقال/هدیه، برداشت، تحویل فیزیکی
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { sendOtp } from '@/lib/auth/otp'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('otp.send', auth.mobile)

  const result = await sendOtp(auth.mobile, 'financial')
  return ok(result)
})
