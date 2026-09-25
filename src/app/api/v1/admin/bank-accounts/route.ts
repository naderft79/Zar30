// ============================================
// Zar30 - GET /api/v1/admin/bank-accounts
// ============================================
// لیست کارت‌های بانکی کاربران — permission: bank_accounts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminBankAccountListQuerySchema } from '@/lib/validators/admin-ops'
import { listAdminBankAccounts } from '@/lib/services/admin-ops.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.BANK_ACCOUNTS_READ)
  const input = parseAdminQuery(req, adminBankAccountListQuerySchema)
  const { rows, total } = await listAdminBankAccounts(input)
  return ok({ bankAccounts: rows }, paginationMeta(input.page, input.limit, total))
})
