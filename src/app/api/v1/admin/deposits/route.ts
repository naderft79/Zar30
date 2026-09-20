// ============================================
// Zar30 - GET /api/v1/admin/deposits
// ============================================
// لیست واریزها — منبع: Transaction(type=DEPOSIT) — permission: deposits.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminDepositListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminDeposits } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DEPOSITS_READ)
  const parsed = adminDepositListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminDeposits(parsed.data)
  const { page, limit } = parsed.data
  return ok({ deposits: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})
