// ============================================
// Zar30 - GET /api/v1/wallet/transactions
// ============================================
// تاریخچه تراکنش‌های کاربر — فقط مالک
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { paginationSchema } from '@/lib/validators/common'
import { listUserTransactions } from '@/lib/finance/wallet.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await listUserTransactions(
    auth.userId,
    parsed.data.page,
    parsed.data.limit,
  )
  const { page, limit } = parsed.data
  return ok(
    { transactions: items },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
