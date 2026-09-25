// ============================================
// Zar30 - GET /api/v1/admin/roles
// ============================================
// ماتریس نقش → permission — roles.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { listAdminRoleMatrix, PERMISSION_CATALOG } from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.ROLES_READ)
  return ok({ roles: listAdminRoleMatrix(), catalog: PERMISSION_CATALOG })
})
