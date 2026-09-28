// ============================================
// Zar30 - /api/v1/admin/zareesi-cards/[id]
// ============================================
// PATCH → تغییر وضعیت / ثبت کد رهگیری
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import {
  rejectZareesiCard,
  setZareesiTracking,
  transitionZareesiCard,
} from '@/lib/finance/zareesi.service'

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    adminNote: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('production'),
    adminNote: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('ship'),
    trackingCode: z.string().trim().min(4, 'کد رهگیری الزامی است').max(50),
  }),
  z.object({
    action: z.literal('activate'),
    adminNote: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('block'),
    reason: z.string().trim().min(3, 'دلیل الزامی است').max(500),
  }),
  z.object({
    action: z.literal('reject'),
    reason: z.string().trim().min(3, 'دلیل الزامی است').max(500),
  }),
  z.object({
    action: z.literal('tracking'),
    trackingCode: z.string().trim().min(4, 'کد رهگیری الزامی است').max(50),
  }),
])

export const PATCH = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminPermission(req, PERMISSIONS.DELIVERY_READ)
    const { id } = await ctx.params

    const raw = await req.json().catch(() => null)
    const parsed = actionSchema.safeParse(raw)
    if (!parsed.success)
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')

    const input = parsed.data
    switch (input.action) {
      case 'approve':
        return ok({
          card: await transitionZareesiCard(id, auth.adminId, 'APPROVED', input.adminNote),
        })
      case 'production':
        return ok({
          card: await transitionZareesiCard(id, auth.adminId, 'PRODUCTION', input.adminNote),
        })
      case 'ship': {
        await setZareesiTracking(id, auth.adminId, input.trackingCode)
        return ok({ card: await transitionZareesiCard(id, auth.adminId, 'SHIPPED') })
      }
      case 'activate':
        return ok({
          card: await transitionZareesiCard(id, auth.adminId, 'ACTIVE', input.adminNote),
        })
      case 'block':
        return ok({ card: await transitionZareesiCard(id, auth.adminId, 'BLOCKED', input.reason) })
      case 'reject':
        return ok({ card: await rejectZareesiCard(id, auth.adminId, input.reason) })
      case 'tracking':
        return ok({ card: await setZareesiTracking(id, auth.adminId, input.trackingCode) })
    }
  },
)
