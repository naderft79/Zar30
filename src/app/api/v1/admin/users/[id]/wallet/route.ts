// ============================================
// Zar30 - GET /api/v1/admin/users/:id/wallet
// ============================================
// کیف پول طلا و تومان کاربر — permission: wallets.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getUserWalletAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.WALLETS_READ)
  const { id } = await ctx.params
  return ok({ wallet: await getUserWalletAdmin(id) })
})
