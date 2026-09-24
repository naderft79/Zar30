// ============================================
// Zar30 - /api/v1/price-alerts
// ============================================
// GET  → لیست هشدارهای قیمت کاربر
// POST → ثبت هشدار — سمت سرور با هر snapshot قیمت چک می‌شود
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { createPriceAlertSchema } from '@/lib/validators/bank'
import { createPriceAlert, listPriceAlerts } from '@/lib/finance/price-alert.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const alerts = await listPriceAlerts(auth.userId)
  return ok({ alerts })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createPriceAlertSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const alert = await createPriceAlert(auth.userId, parsed.data)
  return created({ alert })
})
