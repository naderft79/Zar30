// ============================================
// Zar30 - GET /api/v1/admin/dashboard/feeds
// ============================================
// فیدهای زنده: audit + broadcast + آنلاین + سلامت — permission: dashboard.read
// بدون کش — همیشه تازه‌ترین داده
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getDashboardFeeds } from '@/lib/services/admin-dashboard.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const feeds = await getDashboardFeeds()
  return ok({ feeds })
})
