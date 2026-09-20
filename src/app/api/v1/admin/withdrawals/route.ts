// ============================================
// Zar30 - GET /api/v1/admin/withdrawals
// ============================================
// لیست برداشت‌ها — IBAN همیشه masked — permission: withdrawals.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminWithdrawalListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminWithdrawals } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.WITHDRAWALS_READ)
  const parsed = adminWithdrawalListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminWithdrawals(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { withdrawals: rows },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
