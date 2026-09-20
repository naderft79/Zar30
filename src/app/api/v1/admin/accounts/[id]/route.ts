// ============================================
// Zar30 - GET /api/v1/admin/accounts/:id
// ============================================
// جزئیات حساب دارایی + آخرین ledger entries — permission: accounts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminAccountDetail } from '@/lib/services/admin-finance.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.ACCOUNTS_READ)
  const { id } = await ctx.params
  return ok({ account: await getAdminAccountDetail(id) })
})
