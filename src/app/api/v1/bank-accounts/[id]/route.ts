// ============================================
// Zar30 - /api/v1/bank-accounts/[id]
// ============================================
// DELETE → حذف کارت بانکی — فقط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { deleteBankAccount } from '@/lib/finance/bank-account.service'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await deleteBankAccount(auth.userId, id)
    return ok({ deleted: true })
  },
)
