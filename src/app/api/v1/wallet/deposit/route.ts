// ============================================
// Zar30 - /api/v1/wallet/deposit
// ============================================
// POST → ثبت درخواست واریز (PENDING — اعتبار با ادمین/درگاه)
//        هدر Idempotency-Key الزامی
// GET  → لیست واریزهای کاربر
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { paginationSchema } from '@/lib/validators/common'
import { createDepositSchema } from '@/lib/validators/finance'
import { withIdempotency } from '@/lib/finance/idempotency'
import { requestDeposit } from '@/lib/finance/deposit.service'
import { listUserDeposits } from '@/lib/finance/wallet.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserDeposits(auth.userId, parsed.data.page, parsed.data.limit)
  const { page, limit } = parsed.data
  return ok({ deposits: items }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createDepositSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data: deposit, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'wallet.deposit', body: rawBody },
    () => requestDeposit(auth, { amount: parsed.data.amount }),
  )

  return created({ deposit, replayed })
})
