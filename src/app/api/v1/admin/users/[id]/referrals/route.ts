// ============================================
// Zar30 - GET /api/v1/admin/users/:id/referrals
// ============================================
// دعوت‌های موفق کاربر — permission: referrals.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listUserReferralsAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.REFERRALS_READ)
  const { id } = await ctx.params
  return ok({ referrals: await listUserReferralsAdmin(id) })
})
