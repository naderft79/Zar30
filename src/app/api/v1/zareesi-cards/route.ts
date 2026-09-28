// ============================================
// Zar30 - /api/v1/zareesi-cards
// ============================================
// GET  → لیست کارت‌های زرسی کاربر + پیکربندی عمومی
// POST → سفارش کارت زرسی جدید (کسر کارمزد گرمی از کیف پول طلایی)
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { orderZareesiCardSchema } from '@/lib/validators/finance'
import { getZareesiConfig, listZareesiCards, orderZareesiCard } from '@/lib/finance/zareesi.service'

// GET — لیست کارت‌ها + پیکربندی
export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const [cards, config] = await Promise.all([listZareesiCards(auth.userId), getZareesiConfig()])
  return ok({
    cards,
    config: {
      feeGold: config.feeGold,
      feePost: config.feePost.toString(),
      maxActiveCards: config.maxActiveCards,
    },
  })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = orderZareesiCardSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const card = await orderZareesiCard(auth.userId, parsed.data)
  return created({ card })
})
