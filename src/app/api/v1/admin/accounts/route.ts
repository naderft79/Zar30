// ============================================
// Zar30 - GET /api/v1/admin/accounts
// ============================================
// لیست حساب‌های دارایی — read-only — permission: accounts.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminAccountListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminAccounts } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.ACCOUNTS_READ)
  const parsed = adminAccountListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminAccounts(parsed.data)
  const { page, limit } = parsed.data
  return ok({ accounts: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})
