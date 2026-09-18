// ============================================
// Zarnama - GET /api/v1/dev/otp/[mobile]
// ============================================
// Development Only — خواندن آخرین OTP از Redis برای تست E2E
// در Production هرگز 404 می‌شود
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { redis } from '@/lib/redis/client'

export const GET = withErrorHandler(
  async (_req: Request, ctx: { params: Promise<{ mobile: string }> }) => {
    // دو شرط لازم: فعال‌سازی صریح با env + SMS در حالت Mock
    // با provider واقعی (kavenegar) کلید devotp اصلاً نوشته نمی‌شود
    // و در production واقعی DEV_OTP_ENDPOINT تنظیم نمی‌شود → همیشه 404
    if (process.env.DEV_OTP_ENDPOINT !== 'true' || process.env.SMS_PROVIDER !== 'mock') {
      throw ApiError.notFound('Not found')
    }
    const { mobile } = await ctx.params
    const code = await redis.get(`devotp:${mobile}`)
    return ok({ mobile, code })
  },
)
