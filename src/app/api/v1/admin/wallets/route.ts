// ============================================
// Zar30 - GET /api/v1/admin/wallets
// ============================================
// لیست کیف پول‌ها — read-only — permission: wallets.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminWalletListQuerySchema } from '@/lib/validators/admin-finance'
import { listAdminWallets } from '@/lib/services/admin-finance.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.WALLETS_READ)
  const parsed = adminWalletListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminWallets(parsed.data)
  const { page, limit } = parsed.data
  return ok({ wallets: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})
