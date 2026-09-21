// ============================================
// Zar30 - GET /api/v1/orders/:id
// ============================================
// جزئیات سفارش — فقط مالک سفارش
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { getUserOrder } from '@/lib/finance/order.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const auth = await requireAuth(req)
  const { id } = await ctx.params
  const order = await getUserOrder(auth.userId, id)
  return ok({ order })
})
