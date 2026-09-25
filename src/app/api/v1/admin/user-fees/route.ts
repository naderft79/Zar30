// ============================================
// Zar30 - /api/v1/admin/user-fees
// ============================================
// GET  → لیست overrideهای فردی کارمزد — pricing.read
// POST → ایجاد/به‌روزرسانی override برای کاربر — pricing.update
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { ApiError } from '@/lib/errors/api-error'
import { adminUserFeeSchema } from '@/lib/validators/admin-commerce'
import { listAdminUserFees, upsertAdminUserFee } from '@/lib/services/admin-fees.service'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().max(100).default(20),
  q: z.string().trim().max(80).optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { page, limit, q } = parsed.data
  const { rows, total } = await listAdminUserFees(page, limit, q)
  return ok({ overrides: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const body = await parseBody(req, adminUserFeeSchema)
  const result = await upsertAdminUserFee(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return created(result)
})
