// ============================================
// Zar30 - /api/v1/installments/plans
// ============================================
// GET → طرح‌های فعال اقساطی — عمومی (احراز هویت لازم)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { listInstallmentPlans } from '@/lib/services/installment.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAuth(req)
  const plans = await listInstallmentPlans()
  return ok({ plans })
})
