// ============================================
// Zar30 - POST /api/v1/admin/bank-accounts/:id/delete
// ============================================
// حذف کارت بانکی کاربر — permission: bank_accounts.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminReasonSchema } from '@/lib/validators/admin-delivery'
import { deleteAdminBankAccount } from '@/lib/services/admin-ops.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.BANK_ACCOUNTS_MANAGE)
  const { id } = await ctx.params
  const body = await parseBody(req, adminReasonSchema)
  const result = await deleteAdminBankAccount(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body.reason,
    getSessionMeta(req),
  )
  return ok(result)
})
