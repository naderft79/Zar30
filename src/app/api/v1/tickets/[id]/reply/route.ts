// ============================================
// Zar30 - POST /api/v1/tickets/[id]/reply
// ============================================
// پاسخ کاربر به تیکت خودش — تیکت بسته را نمی‌پذیرد
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { z } from 'zod'
import { replyTicket } from '@/lib/services/ticket.service'

const replySchema = z.object({
  body: z.string().min(1, 'متن پاسخ الزامی است').max(5000),
})

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('api.general', auth.userId)
    const { id } = await ctx.params

    const rawBody = await req.json().catch(() => null)
    const parsed = replySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
    }

    const message = await replyTicket(auth, id, parsed.data.body)
    return ok(message)
  },
)
