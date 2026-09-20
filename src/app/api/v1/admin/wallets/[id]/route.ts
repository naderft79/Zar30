// ============================================
// Zar30 - GET /api/v1/admin/wallets/:id
// ============================================
// جزئیات کیف پول + حساب‌ها + آخرین تراکنش‌ها — permission: wallets.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminWalletDetail } from '@/lib/services/admin-finance.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.WALLETS_READ)
  const { id } = await ctx.params
  return ok({ wallet: await getAdminWalletDetail(id) })
})
