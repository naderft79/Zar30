// ============================================
// Zar30 - /api/v1/admin/notification-templates/:id
// ============================================
// PUT    → ویرایش قالب — notifications.manage_templates
// DELETE → حذف قالب — notifications.manage_templates
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminNotificationTemplateSchema } from '@/lib/validators/admin-system'
import {
  deleteAdminNotificationTemplate,
  upsertAdminNotificationTemplate,
} from '@/lib/services/admin-system.service'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_MANAGE_TEMPLATES)
  const { id } = await ctx.params
  const body = await parseBody(req, adminNotificationTemplateSchema)
  const result = await upsertAdminNotificationTemplate(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
    id,
  )
  return ok(result)
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.NOTIFICATIONS_MANAGE_TEMPLATES)
  const { id } = await ctx.params
  const result = await deleteAdminNotificationTemplate(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    getSessionMeta(req),
  )
  return ok(result)
})
