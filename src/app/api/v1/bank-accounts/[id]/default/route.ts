// ============================================
// Zar30 - /api/v1/bank-accounts/[id]/default
// ============================================
// POST → تنظیم کارت پیش‌فرض برداشت
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { setDefaultBankAccount } from '@/lib/finance/bank-account.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await setDefaultBankAccount(auth.userId, id)
    return ok({ isDefault: true })
  },
)
