// ============================================
// Zar30 - GET/POST /api/v1/admin/users/:id/sessions
// ============================================
// نشست‌های کاربر + لغو همه نشست‌های فعال
// read: security.read / revoke: security.manage + audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { listUserSessionsAdmin, revokeUserSessionsByAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

const revokeSchema = z.object({
  reason: z.string().trim().min(5).max(500),
})

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.SECURITY_READ)
  const { id } = await ctx.params
  return ok({ sessions: await listUserSessionsAdmin(id) })
})

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SECURITY_MANAGE)
  const { id } = await ctx.params
  const input = await parseBody(req, revokeSchema)
  const result = await revokeUserSessionsByAdmin(admin, id, input.reason, getSessionMeta(req))
  return ok(result)
})
