// ============================================
// Zar30 - POST /api/v1/installments/pay
// ============================================
// پرداخت یک قسط از کیف پول تومانی — Idempotency-Key الزامی
// (عملیات مالی واقعی — همان قرارداد core بقیه endpoints)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { z } from 'zod'
import { withIdempotency } from '@/lib/finance/idempotency'
import { payInstallment } from '@/lib/services/installment.service'

const paySchema = z.object({
  contractId: z.string().min(1),
  installmentNumber: z.number().int().min(1).max(120),
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = paySchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'installments.pay', body: rawBody },
    () => payInstallment(auth, parsed.data.contractId, parsed.data.installmentNumber),
  )

  return ok({ ...data, replayed })
})
