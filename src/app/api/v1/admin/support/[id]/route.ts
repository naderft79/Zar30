// ============================================
// Zar30 - GET /api/v1/admin/support/[id]
// ============================================
// جزئیات تیکت + پیام‌ها — permission: tickets.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getTicketMessages } from '@/lib/services/ticket.service'

export const GET = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdminPermission(req, PERMISSIONS.TICKETS_READ)
    const { id } = await ctx.params
    return ok(await getTicketMessages(id))
  },
)
