// ============================================
// Zar30 - POST /api/v1/admin/delivery/:id/approve
// ============================================
// تایید درخواست — PENDING → APPROVED — permission: delivery.review
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { approveDelivery } from '@/lib/finance/delivery.service'

type Ctx = { params: Promise<{ id: string }> }

const bodySchema = z.object({ note: z.string().trim().max(500).optional() })

export const POST = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.DELIVERY_REVIEW)
  const { id } = await ctx.params
  const body = await parseBody(req, bodySchema)
  const result = await approveDelivery(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    id,
    body.note,
    getSessionMeta(req),
  )
  return ok({ delivery: result })
})
