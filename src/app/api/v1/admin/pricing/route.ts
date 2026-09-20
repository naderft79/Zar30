// ============================================
// Zar30 - GET /api/v1/admin/pricing
// ============================================
// تاریخچه قیمت‌گذاری طلا + آخرین قیمت — read-only — permission: pricing.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminPricingListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminPrices } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)
  const parsed = adminPricingListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total, latest } = await listAdminPrices(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { prices: rows, latest },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
