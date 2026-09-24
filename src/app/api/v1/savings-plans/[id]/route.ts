// ============================================
// Zar30 - /api/v1/savings-plans/[id]
// ============================================
// PATCH  → فعال/غیرفعال کردن طرح — فقط مالک
// DELETE → حذف طرح — فقط مالک
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { deleteSavingsPlan, setSavingsPlanActive } from '@/lib/finance/sip.service'

const patchSchema = z.object({ active: z.boolean() })

export const PATCH = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params

    const rawBody = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(rawBody)
    if (!parsed.success) throw ApiError.badRequest('ورودی نامعتبر است')

    const plan = await setSavingsPlanActive(auth.userId, id, parsed.data.active)
    return ok({ plan })
  },
)

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params
    await deleteSavingsPlan(auth.userId, id)
    return ok({ deleted: true })
  },
)
