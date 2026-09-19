// ============================================
// Zar30 - POST /api/v1/users/notifications/[id]/read
// ============================================
// علامت‌گذاری اعلان به‌عنوان خوانده‌شده — فقط اعلان خود کاربر
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    const { id } = await ctx.params
    const result = await userService.markNotificationRead(auth.userId, id)
    return ok(result)
  },
)
