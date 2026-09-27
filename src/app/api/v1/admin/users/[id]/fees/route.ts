// ============================================
// Zar30 - GET/PUT /api/v1/admin/users/:id/fees
// ============================================
// کارمزد اختصاصی کاربر (override فردی)
// read: pricing.read / write: pricing.update + audit
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminUserFeeSchema } from '@/lib/validators/admin-commerce'
import {
  getUserFeeOverrideAdmin,
  setUserFeeOverrideByAdmin,
} from '@/lib/services/admin-user.service'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)
  const { id } = await ctx.params
  return ok({ override: await getUserFeeOverrideAdmin(id) })
})

export const PUT = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const { id } = await ctx.params
  const input = await parseBody(req, adminUserFeeSchema)
  const result = await setUserFeeOverrideByAdmin(
    admin,
    id,
    {
      buyFeeBps: input.buyFeeBps ?? null,
      sellFeeBps: input.sellFeeBps ?? null,
      note: input.note ?? undefined,
    },
    getSessionMeta(req),
  )
  return ok(result)
})
