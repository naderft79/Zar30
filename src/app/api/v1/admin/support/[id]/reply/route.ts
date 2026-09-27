// ============================================
// Zar30 - POST /api/v1/admin/support/[id]/reply
// ============================================
// پاسخ ادمین — تیکت → ANSWERED + اعلان به کاربر — permission: tickets.reply
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { adminReplyTicket } from '@/lib/services/ticket.service'

const replySchema = z.object({
  body: z.string().min(1, 'متن پاسخ الزامی است').max(5000),
})

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.TICKETS_REPLY)
    const { id } = await ctx.params

    const rawBody = await req.json().catch(() => null)
    const parsed = replySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
    }

    const message = await adminReplyTicket(admin, id, parsed.data.body)
    return ok(message)
  },
)
