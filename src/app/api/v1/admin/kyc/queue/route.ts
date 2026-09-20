// ============================================
// Zar30 - GET /api/v1/admin/kyc/queue
// ============================================
// صف بررسی KYC — permission: kyc.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { kycService } from '@/lib/services/kyc.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.KYC_READ)
  const queue = await kycService.reviewQueue()
  return ok({ queue })
})
