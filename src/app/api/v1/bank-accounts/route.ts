// ============================================
// Zar30 - /api/v1/bank-accounts
// ============================================
// GET  → لیست کارت‌های بانکی کاربر
// POST → ثبت کارت جدید — شبا با checksum مد-۹۷ اعتبارسنجی می‌شود
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { createBankAccountSchema } from '@/lib/validators/bank'
import { createBankAccount, listBankAccounts } from '@/lib/finance/bank-account.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const accounts = await listBankAccounts(auth.userId)
  return ok({ accounts })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createBankAccountSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const account = await createBankAccount(auth.userId, parsed.data)
  return created({ account })
})
