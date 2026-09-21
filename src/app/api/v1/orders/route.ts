// ============================================
// Zar30 - /api/v1/orders
// ============================================
// GET  → تاریخچه سفارش‌های کاربر
// POST → معامله آنی (BUY: rialAmount | SELL: goldAmount)
//        هدر Idempotency-Key الزامی — اجرای دوباره اثر مالی ندارد
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { paginationSchema } from '@/lib/validators/common'
import { createOrderSchema } from '@/lib/validators/finance'
import { Decimal } from '@/lib/finance/money'
import { withIdempotency } from '@/lib/finance/idempotency'
import { buyGold, sellGold, listUserOrders } from '@/lib/finance/order.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserOrders(auth.userId, parsed.data.page, parsed.data.limit)
  const { page, limit } = parsed.data
  return ok({ orders: items }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('trading.execute', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createOrderSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { data: order, replayed } = await withIdempotency(
    { req, userId: auth.userId, endpoint: 'orders.create', body: rawBody },
    async () =>
      parsed.data.type === 'BUY'
        ? buyGold(auth, { rialAmount: parsed.data.rialAmount! })
        : sellGold(auth, { goldAmount: new Decimal(parsed.data.goldAmount!) }),
  )

  return created({ order, replayed })
})
