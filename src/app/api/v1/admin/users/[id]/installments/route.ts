// ============================================
// Zar30 - GET /api/v1/admin/users/:id/installments
// ============================================
// قراردادهای خرید قسطی کاربر — permission: installments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listUserInstallmentsAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)
  const { id } = await ctx.params
  return ok({ contracts: await listUserInstallmentsAdmin(id) })
})
