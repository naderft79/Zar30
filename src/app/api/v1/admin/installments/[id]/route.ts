// ============================================
// Zar30 - GET /api/v1/admin/installments/[id]
// ============================================
// جزئیات قرارداد قسطی + جدول اقساط — permission: installments.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { getAdminInstallmentDetail } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)
    const { id } = await ctx.params
    const detail = await getAdminInstallmentDetail(id)
    return ok({ contract: detail })
  },
)
