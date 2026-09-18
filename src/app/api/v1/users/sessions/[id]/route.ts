// ============================================
// Zarnama - DELETE /api/v1/users/sessions/[id]
// ============================================
// لغو یک نشست — فقط نشست خود کاربر (user isolation)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { userService } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/auth/guard'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    const { id } = await ctx.params
    const meta = getSessionMeta(req)
    const result = await userService.revokeUserSessionById(auth.userId, id, meta)
    return ok(result)
  },
)
