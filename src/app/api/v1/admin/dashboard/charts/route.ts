// ============================================
// Zar30 - GET /api/v1/admin/dashboard/charts
// ============================================
// سری‌های نمودار با overlay دوره قبل — permission: dashboard.read
// ?range=7|30|90 — کش Redis ۶۰s
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getDashboardCharts } from '@/lib/services/admin-dashboard.service'
import { dashboardChartsQuerySchema } from '@/lib/validators/admin-dashboard'
import type { ChartRange } from '@/lib/services/admin-dashboard.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const parsed = dashboardChartsQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const charts = await getDashboardCharts(parsed.data.range as ChartRange)
  return ok({ charts })
})
