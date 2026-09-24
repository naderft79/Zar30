// ============================================
// Zar30 - /api/v1/addresses/[id]/default
// ============================================
// POST → تنظیم آدرس پیش‌فرض
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { setDefaultAddress } from '@/lib/finance/address.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await setDefaultAddress(auth.userId, id)
    return ok({ isDefault: true })
  },
)
