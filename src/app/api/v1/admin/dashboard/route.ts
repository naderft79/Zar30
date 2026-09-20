// ============================================
// Zar30 - GET /api/v1/admin/dashboard
// ============================================
// شاخص‌های عملیاتی واقعی از PostgreSQL — permission: dashboard.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminDashboard } from '@/lib/services/admin-dashboard.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const dashboard = await getAdminDashboard()
  return ok({ dashboard })
})
