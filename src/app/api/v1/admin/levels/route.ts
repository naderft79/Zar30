// ============================================
// Zar30 - /api/v1/admin/levels
// ============================================
// GET  → سطوح KYC + توزیع کاربران — levels.read
// POST → upsert پیکربندی سطح — levels.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminKycLevelSchema } from '@/lib/validators/admin-commerce'
import { listAdminKycLevels, upsertAdminKycLevel } from '@/lib/services/admin-fees.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LEVELS_READ)
  const levels = await listAdminKycLevels()
  return ok({ levels })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.LEVELS_MANAGE)
  const body = await parseBody(req, adminKycLevelSchema)
  const result = await upsertAdminKycLevel(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return ok(result)
})
