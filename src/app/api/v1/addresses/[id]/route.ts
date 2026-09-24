// ============================================
// Zar30 - /api/v1/addresses/[id]
// ============================================
// DELETE → حذف آدرس — فقط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { deleteAddress } from '@/lib/finance/address.service'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await deleteAddress(auth.userId, id)
    return ok({ deleted: true })
  },
)
