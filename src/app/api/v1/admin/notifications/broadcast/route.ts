// ============================================
// Zar30 - POST /api/v1/admin/notifications/broadcast
// ============================================
// اعلان گروهی درون‌برنامه‌ای — notifications.send
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminBroadcastSchema } from '@/lib/validators/admin-system'
import { broadcastAdminNotification } from '@/lib/services/admin-system.service'

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_SEND)
  const body = await parseBody(req, adminBroadcastSchema)
  const result = await broadcastAdminNotification(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return ok(result)
})
