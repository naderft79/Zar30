// ============================================
// Zar30 - /api/v1/addresses
// ============================================
// GET  → لیست آدرس‌های کاربر
// POST → ثبت آدرس جدید
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { createAddressSchema } from '@/lib/validators/bank'
import { createAddress, listAddresses } from '@/lib/finance/address.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const addresses = await listAddresses(auth.userId)
  return ok({ addresses })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createAddressSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const address = await createAddress(auth.userId, parsed.data)
  return created({ address })
})
