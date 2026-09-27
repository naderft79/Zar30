// ============================================
// Zar30 - POST /api/v1/tickets/[id]/close
// ============================================
// بستن تیکت توسط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { closeTicketByUser } from '@/lib/services/ticket.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    const { id } = await ctx.params
    return ok(await closeTicketByUser(auth, id))
  },
)
