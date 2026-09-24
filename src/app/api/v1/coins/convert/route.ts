// ============================================
// Zar30 - /api/v1/coins/convert
// ============================================
// POST → تبدیل طلای آب‌شده به سکه/شمش — Idempotency-Key الزامی
//        طلا به وزن محصول + تومان به اجرت — journal اتمیک سمت سرور
// ============================================

import { created, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { convertCoinSchema } from '@/lib/validators/bank'
import { withIdempotency } from '@/lib/finance/idempotency'
import { convertToCoin } from '@/lib/finance/coin.service'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = convertCoinSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data: result, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'coins.convert', body: rawBody },
    () => convertToCoin(auth, parsed.data),
  )

  return created({ result, replayed })
})
