// ============================================
// Zar30 - GET /api/v1/wallet
// ============================================
// خلاصه کیف پول — موجودی هر دارایی به صورت string امن
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { getWalletSummary } from '@/lib/finance/wallet.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const wallet = await getWalletSummary(auth.userId)
  return ok(wallet)
})
