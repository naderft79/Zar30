// ============================================
// Zar30 - /api/v1/delivery/[id]/cancel
// ============================================
// POST → لغو درخواست تحویل در وضعیت PENDING — فقط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { cancelDeliveryRequest } from '@/lib/finance/delivery.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    const delivery = await cancelDeliveryRequest(auth.userId, id)
    return ok({ delivery })
  },
)
