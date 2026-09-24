// ============================================
// Zar30 - /api/v1/price-alerts/[id]
// ============================================
// DELETE → حذف هشدار قیمت — فقط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { deletePriceAlert } from '@/lib/finance/price-alert.service'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await deletePriceAlert(auth.userId, id)
    return ok({ deleted: true })
  },
)
