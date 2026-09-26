// ============================================
// Zar30 - GET /api/v1/admin/installments/stats
// ============================================
// آمار KPI قسطی — permission: installments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminInstallmentStats } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)
  return ok({ stats: await getAdminInstallmentStats() })
})
