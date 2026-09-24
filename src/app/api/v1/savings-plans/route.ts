// ============================================
// Zar30 - /api/v1/savings-plans
// ============================================
// GET  → لیست طرح‌های خرید خودکار کاربر
// POST → ایجاد طرح — اجرا توسط endpoint کرون با secret
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { createSipSchema } from '@/lib/validators/bank'
import { createSavingsPlan, listSavingsPlans } from '@/lib/finance/sip.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const plans = await listSavingsPlans(auth.userId)
  return ok({ plans })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createSipSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const plan = await createSavingsPlan(auth.userId, parsed.data)
  return created({ plan })
})
