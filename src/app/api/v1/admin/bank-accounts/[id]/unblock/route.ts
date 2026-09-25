// ============================================
// Zar30 - POST /api/v1/admin/bank-accounts/:id/unblock
// ============================================
// رفع مسدودی کارت — permission: bank_accounts.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { setBankAccountBlocked } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.BANK_ACCOUNTS_MANAGE)
  const { id } = await ctx.params
  const result = await setBankAccountBlocked(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    false,
    undefined,
    getSessionMeta(req),
  )
  return ok(result)
})
