// ============================================
// Zar30 - /api/v1/delivery
// ============================================
// GET  → لیست درخواست‌های تحویل فیزیکی کاربر
// POST → ثبت درخواست تحویل — OTP مالی الزامی + Idempotency-Key
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { paginationSchema } from '@/lib/validators/common'
import { createDeliverySchema } from '@/lib/validators/bank'
import { verifyOtp } from '@/lib/auth/otp'
import { withIdempotency } from '@/lib/finance/idempotency'
import { createDeliveryRequest, listDeliveryRequests } from '@/lib/finance/delivery.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listDeliveryRequests(
    auth.userId,
    parsed.data.page,
    parsed.data.limit,
  )
  const { page, limit } = parsed.data
  return ok(
    { deliveries: items },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createDeliverySchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  // عملیات حساس — تاییدیه OTP مالی
  await verifyOtp(auth.mobile, 'financial', parsed.data.otpCode!)

  const { data: delivery, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'delivery.create', body: rawBody },
    () =>
      createDeliveryRequest(auth.userId, {
        grams: parsed.data.grams,
        method: parsed.data.method,
        addressId: parsed.data.addressId,
      }),
  )

  return created({ delivery, replayed })
})
