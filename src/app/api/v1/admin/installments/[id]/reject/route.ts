// ============================================
// Zar30 - POST /api/v1/admin/installments/[id]/reject
// ============================================
// رد قرارداد PENDING — permission: installments.review — strict audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { writeAuditStrict } from '@/lib/audit/audit'
import { rejectInstallmentContract } from '@/lib/services/installment.service'

const rejectSchema = z.object({
  reason: z.string().min(3, 'دلیل رد الزامی است').max(500),
})

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_REVIEW)
    const { id } = await ctx.params
    const input = await parseBody(req, rejectSchema)

    const result = await rejectInstallmentContract({ adminId: admin.adminId }, id, input.reason)

    const meta = getSessionMeta(req)
    await writeAuditStrict({
      actorType: 'admin',
      actorId: admin.adminId,
      actorRole: admin.adminRole,
      action: 'installment.reject',
      entityType: 'installment_contract',
      entityId: id,
      reason: input.reason,
      ip: meta.ip,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    return ok(result)
  },
)
