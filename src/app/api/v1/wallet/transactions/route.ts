// ============================================
// Zar30 - GET /api/v1/wallet/transactions
// ============================================
// تاریخچه تراکنش‌های کاربر — فقط مالک
// فیلتر: type | status | from | to (تاریخ ISO)
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { paginationSchema } from '@/lib/validators/common'
import { listUserTransactions } from '@/lib/finance/wallet.service'

const querySchema = paginationSchema.extend({
  type: z.enum(['DEPOSIT', 'WITHDRAW', 'FEE', 'TRANSFER']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { page, limit, type, status, from, to } = parsed.data
  const { items, total } = await listUserTransactions(auth.userId, page, limit, {
    type,
    status,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  })
  return ok(
    { transactions: items },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
