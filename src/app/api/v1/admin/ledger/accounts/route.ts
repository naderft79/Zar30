// ============================================
// Zar30 - GET /api/v1/admin/ledger/accounts
// ============================================
// مانده حساب‌های دفتر کل — ledger.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listAdminLedgerAccounts } from '@/lib/services/admin-reports.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LEDGER_READ)
  const accounts = await listAdminLedgerAccounts()
  return ok({ accounts })
})
