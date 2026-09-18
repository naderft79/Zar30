// ============================================
// Zarnama - DELETE /api/v1/auth/sessions/[id]
// ============================================
// Revoke یک Session — فقط Sessionهای خود کاربر (user isolation)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { authService } from '@/lib/services/auth.service'
import { requireAuth } from '@/lib/auth/guard'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    const { id } = await ctx.params
    const meta = getSessionMeta(req)
    const result = await authService.revokeUserSession(auth.userId, id, meta)
    return ok(result)
  },
)
