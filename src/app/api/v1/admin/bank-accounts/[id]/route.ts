// ============================================
// Zar30 - GET /api/v1/admin/bank-accounts/:id
// ============================================
// جزئیات کارت بانکی — permission: bank_accounts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminBankAccount } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.BANK_ACCOUNTS_READ)
  const { id } = await ctx.params
  const detail = await getAdminBankAccount(id)
  if (!detail) throw ApiError.notFound('کارت بانکی یافت نشد')
  return ok({ bankAccount: detail })
})
