// ============================================
// Zar30 - /api/v1/wallet/withdraw
// ============================================
// POST → درخواست برداشت — مبلغ بلافاصله قفل می‌شود (double-spend ممکن نیست)
//        OTP مالی الزامی — شبا یا از کارت ذخیره‌شده کاربر یا ورودی دستی
//        هدر Idempotency-Key الزامی
// GET  → لیست برداشت‌های کاربر
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { paginationSchema } from '@/lib/validators/common'
import { createWithdrawalSchema } from '@/lib/validators/finance'
import { verifyOtp } from '@/lib/auth/otp'
import { withIdempotency } from '@/lib/finance/idempotency'
import { requestWithdrawal, listUserWithdrawals } from '@/lib/finance/withdrawal.service'
import { getOwnedIban } from '@/lib/finance/bank-account.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserWithdrawals(
    auth.userId,
    parsed.data.page,
    parsed.data.limit,
  )
  const { page, limit } = parsed.data
  return ok(
    { withdrawals: items },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createWithdrawalSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  // برداشت عملیات مالی حساس است — OTP مالی اجباری
  await verifyOtp(auth.mobile, 'financial', parsed.data.otpCode)

  // شبا یا از کارت ذخیره‌شده کاربر می‌آید یا ورودی دستی — هر دو به نام کاربر باید باشند
  const iban = parsed.data.bankAccountId
    ? await getOwnedIban(auth.userId, parsed.data.bankAccountId)
    : parsed.data.iban!

  const { data: withdrawal, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'wallet.withdraw', body: rawBody },
    () => requestWithdrawal(auth, { amount: parsed.data.amount, iban }),
  )

  return created({ withdrawal, replayed })
})
