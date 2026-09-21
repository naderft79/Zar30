// ============================================
// Zar30 - GET /api/v1/admin/reconciliation
// ============================================
// تطبیق موجودی حساب‌ها با دفتر کل — permission: ledger.read
// mismatch فقط گزارش می‌شود؛ اصلاح خودکار هرگز انجام نمی‌شود
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { paginationSchema } from '@/lib/validators/common'
import { reconcileAssetAccounts } from '@/lib/finance/reconciliation.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LEDGER_READ)
  const parsed = paginationSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترها نامعتبرند')
  }
  const { items, total } = await reconcileAssetAccounts(parsed.data.page, parsed.data.limit)
  const { page, limit } = parsed.data
  return ok(
    {
      rows: items,
      mismatches: items.filter((r) => !r.ok).length,
    },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
