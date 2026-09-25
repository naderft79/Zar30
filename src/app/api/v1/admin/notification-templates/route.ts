// ============================================
// Zar30 - /api/v1/admin/notification-templates
// ============================================
// GET  → لیست قالب‌ها — notifications.read
// POST → ایجاد قالب — notifications.manage_templates
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminNotificationTemplateSchema } from '@/lib/validators/admin-system'
import {
  listAdminNotificationTemplates,
  upsertAdminNotificationTemplate,
} from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_READ)
  const templates = await listAdminNotificationTemplates()
  return ok({ templates })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_MANAGE_TEMPLATES)
  const body = await parseBody(req, adminNotificationTemplateSchema)
  const result = await upsertAdminNotificationTemplate(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
