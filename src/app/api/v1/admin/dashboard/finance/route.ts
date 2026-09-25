// ============================================
// Zar30 - GET /api/v1/admin/dashboard/finance
// ============================================
// ویجت‌های مالی: ledger balances + P&L + cashflow + recon — permission: ledger.read
// کش Redis ۳۰s
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getDashboardFinance } from '@/lib/services/admin-dashboard.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LEDGER_READ)
  const finance = await getDashboardFinance()
  return ok({ finance })
})
