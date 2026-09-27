// ============================================
// Zar30 - POST /api/v1/admin/users/:id/message
// ============================================
// ارسال پیامک/اعلان به یک کاربر — permission: notifications.send + audit
// پیام به‌عنوان Notification با کانال منتخب ثبت می‌شود
// ============================================

import { created, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserSmsSchema } from '@/lib/validators/admin'
import { sendUserMessageByAdmin } from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_SEND)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserSmsSchema)
  const result = await sendUserMessageByAdmin(admin, id, input, getSessionMeta(req))
  return created(result)
})
