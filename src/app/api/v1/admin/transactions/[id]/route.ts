// ============================================
// Zar30 - GET /api/v1/admin/transactions/:id
// ============================================
// جزئیات تراکنش + wallet + journal/ledger + audit — permission: transactions.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminTransactionDetail } from '@/lib/services/admin-finance.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.TRANSACTIONS_READ)
  const { id } = await ctx.params
  return ok({ transaction: await getAdminTransactionDetail(id) })
})
