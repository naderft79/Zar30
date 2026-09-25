// ============================================
// Zar30 - GET /api/v1/admin/system/health
// ============================================
// سلامت زیرساخت + صف‌های عملیاتی — system.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminSystemHealth } from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SYSTEM_READ)
  const health = await getAdminSystemHealth()
  return ok({ health })
})
