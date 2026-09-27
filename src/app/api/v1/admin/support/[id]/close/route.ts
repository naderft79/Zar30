// ============================================
// Zar30 - POST /api/v1/admin/support/[id]/close
// ============================================
// بستن تیکت — permission: tickets.reply
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminCloseTicket } from '@/lib/services/ticket.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.TICKETS_REPLY)
    const { id } = await ctx.params
    return ok(await adminCloseTicket(admin, id))
  },
)
