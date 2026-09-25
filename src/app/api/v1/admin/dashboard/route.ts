// ============================================
// Zar30 - GET /api/v1/admin/dashboard
// ============================================
// داشبورد V2 — KPI + صف‌ها + هشدارها + سلامت — permission: dashboard.read
// ?period=24h|7d|30d
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getAdminDashboardV2 } from '@/lib/services/admin-dashboard.service'
import { dashboardPeriodSchema } from '@/lib/validators/admin-dashboard'

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const parsed = dashboardPeriodSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const dashboard = await getAdminDashboardV2(ctx.permissions, parsed.data.period)
  return ok({ dashboard })
})
