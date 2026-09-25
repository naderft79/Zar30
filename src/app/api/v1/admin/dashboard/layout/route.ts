// ============================================
// Zar30 - GET|PUT /api/v1/admin/dashboard/layout
// ============================================
// ترجیحات داشبورد هر مدیر — hiddenWidgets در AdminUser.preferences
// permission: dashboard.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getDashboardLayout, saveDashboardLayout } from '@/lib/services/admin-dashboard.service'
import { dashboardLayoutSchema } from '@/lib/validators/admin-dashboard'
import { writeAudit } from '@/lib/audit/audit'

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const layout = await getDashboardLayout(ctx.adminId)
  return ok({ layout })
})

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const parsed = dashboardLayoutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }
  await saveDashboardLayout(ctx.adminId, parsed.data.hiddenWidgets)
  void writeAudit({
    actorType: 'admin',
    actorId: ctx.adminId,
    actorRole: ctx.adminRole,
    action: 'dashboard.layout.update',
    entityType: 'admin_user',
    entityId: ctx.adminId,
    after: { hiddenWidgets: parsed.data.hiddenWidgets },
  })
  return ok({ saved: true })
})
