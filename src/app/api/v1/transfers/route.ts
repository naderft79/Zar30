// ============================================
// Zar30 - /api/v1/transfers
// ============================================
// GET  → لیست انتقال‌های ارسال/دریافت کاربر
// POST → انتقال داخلی طلا یا هدیه طلا — OTP مالی + Idempotency-Key الزامی
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { paginationSchema } from '@/lib/validators/common'
import { createTransferSchema } from '@/lib/validators/bank'
import { verifyOtp } from '@/lib/auth/otp'
import { withIdempotency } from '@/lib/finance/idempotency'
import { createTransfer, listUserTransfers } from '@/lib/finance/transfer.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserTransfers(auth.userId, parsed.data.page, parsed.data.limit)
  const { page, limit } = parsed.data
  return ok({ transfers: items }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createTransferSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  // عملیات مالی حساس — OTP قبل از هر ledger write
  await verifyOtp(auth.mobile, 'financial', parsed.data.otpCode)

  const { data: transfer, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'transfers.create', body: rawBody },
    () =>
      createTransfer(auth.userId, {
        recipientMobile: parsed.data.recipientMobile,
        assetType: parsed.data.assetType,
        tomanAmount: parsed.data.tomanAmount,
        goldAmount: parsed.data.goldAmount,
        kind: parsed.data.kind,
        giftMessage: parsed.data.giftMessage,
      }),
  )

  return created({ transfer, replayed })
})
