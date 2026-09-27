// ============================================
// Zar30 - GET /api/v1/admin/users/:id/investments
// ============================================
// موقعیت‌های سرمایه‌گذاری/زرکار کاربر — permission: investments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listUserInvestmentsAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.INVESTMENTS_READ)
  const { id } = await ctx.params
  return ok({ positions: await listUserInvestmentsAdmin(id) })
})
