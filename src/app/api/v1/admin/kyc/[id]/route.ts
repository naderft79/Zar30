// ============================================
// Zar30 - GET /api/v1/admin/kyc/:id
// ============================================
// جزئیات پرونده KYC — بدون ciphertext/کلیدهای storage — permission: kyc.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminKycDetail } from '@/lib/services/admin-kyc.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.KYC_READ)
  const { id } = await ctx.params
  const submission = await getAdminKycDetail(id)
  return ok({ submission })
})
