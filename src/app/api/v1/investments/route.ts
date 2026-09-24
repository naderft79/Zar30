// ============================================
// Zar30 - /api/v1/investments (زرکار)
// ============================================
// GET  → طرح‌های فعال زرکار + موقعیت‌های کاربر
// POST → سپرده‌گذاری — قفل طلا + Idempotency-Key الزامی
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { subscribeZarkarSchema } from '@/lib/validators/bank'
import { withIdempotency } from '@/lib/finance/idempotency'
import { listUserPositions, listZarkarPlans, subscribeZarkar } from '@/lib/finance/zarkar.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const [plans, positions] = await Promise.all([listZarkarPlans(), listUserPositions(auth.userId)])
  return ok({ plans, positions })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = subscribeZarkarSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data: position, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'investments.subscribe', body: rawBody },
    () =>
      subscribeZarkar(auth, {
        planId: parsed.data.planId,
        goldGrams: parsed.data.goldGrams,
      }),
  )

  return created({ position, replayed })
})
