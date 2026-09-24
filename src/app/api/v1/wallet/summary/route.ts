// ============================================
// Zar30 - /api/v1/wallet/summary
// ============================================
// GET → خلاصه مالی یکپارچه صفحه دارایی‌ها
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { getFinancialSummary } from '@/lib/finance/summary.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const summary = await getFinancialSummary(auth.userId)
  return ok({ summary })
})
