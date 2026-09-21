// ============================================
// Zar30 - /api/v1/payments
// ============================================
// GET  → لیست پرداخت‌های کاربر — فقط مالک
// POST → ایجاد جلسه پرداخت برای شارژ کیف پول (تومان)
//        هدر Idempotency-Key الزامی — پاسخ: redirectUrl به درگاه
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { withIdempotency } from '@/lib/finance/idempotency'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { requireAuth } from '@/lib/auth/guard'
import { paginationSchema } from '@/lib/validators/common'
import { createDepositSchema } from '@/lib/validators/finance'
import { ApiError } from '@/lib/errors/api-error'
import { createDepositPayment, listUserPayments } from '@/lib/payment/payment.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserPayments(auth.userId, parsed.data.page, parsed.data.limit)
  const { page, limit } = parsed.data
  return ok({ payments: items }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createDepositSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'payments.create', body: rawBody },
    () => createDepositPayment(auth, { amount: parsed.data.amount }),
  )
  return created({ payment: data, replayed })
})
