// ============================================
// Zar30 - /api/v1/wallet/deposit/manual
// ============================================
// POST → واریز شناسه‌دار (کارت‌به‌کارت) — کاربر شماره پیگیری می‌دهد
//        اعتبارسنجی و credit توسط ادمین — Idempotency-Key الزامی
// ============================================

import { created, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { manualDepositSchema } from '@/lib/validators/bank'
import { withIdempotency } from '@/lib/finance/idempotency'
import { requestManualDeposit } from '@/lib/finance/deposit.service'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = manualDepositSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data: deposit, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'wallet.deposit.manual', body: rawBody },
    () =>
      requestManualDeposit(auth, { amount: parsed.data.amount, bankRef: parsed.data.trackingRef }),
  )

  return created({ deposit, replayed })
})
