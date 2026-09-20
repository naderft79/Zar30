// ============================================
// Zar30 - GET /api/v1/admin/transactions
// ============================================
// لیست تراکنش‌ها — read-only — permission: transactions.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminTransactionListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminTransactions } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.TRANSACTIONS_READ)
  const parsed = adminTransactionListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminTransactions(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { transactions: rows },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
