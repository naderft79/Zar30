// ============================================
// Zar30 - GET /api/v1/admin/users/:id/bank-accounts
// ============================================
// کارت‌ها و شباهای کاربر — permission: bank_accounts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listUserBankAccountsAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.BANK_ACCOUNTS_READ)
  const { id } = await ctx.params
  return ok({ accounts: await listUserBankAccountsAdmin(id) })
})
