// ============================================
// Zar30 - GET /api/v1/admin/gold
// ============================================
// دارایی طلای کاربران — aggregate + لیست حساب‌های GOLD — permission: gold.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { getAdminGoldHoldings } from '@/lib/services/admin-finance.service'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.GOLD_READ)
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const data = await getAdminGoldHoldings(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { summary: data.summary, accounts: data.rows },
    { page, limit, total: data.total, totalPages: Math.ceil(data.total / limit) || 1 },
  )
})
