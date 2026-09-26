// ============================================
// Zar30 - POST /api/v1/admin/installments/[id]/approve
// ============================================
// صدور قرارداد قسطی — وصول پیش‌پرداخت + تحویل طلا + جدول اقساط
// permission: installments.review — strict audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { approveInstallmentContract } from '@/lib/services/installment.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_REVIEW)
    const { id } = await ctx.params
    const result = await approveInstallmentContract({ adminId: admin.adminId }, id)
    return ok(result)
  },
)
