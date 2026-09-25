// ============================================
// Zar30 - GET /api/v1/admin/coin-holdings
// ============================================
// لیست موجودی سکه/شمش کاربران — read-only — products.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminCoinHoldingListQuerySchema } from '@/lib/validators/admin-commerce'
import {
  listAdminCoinHoldings,
  listAdminCoinProductOptions,
} from '@/lib/services/admin-commerce.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRODUCTS_READ)
  const input = parseAdminQuery(req, adminCoinHoldingListQuerySchema)
  const [{ rows, total }, productOptions] = await Promise.all([
    listAdminCoinHoldings(input),
    listAdminCoinProductOptions(),
  ])
  return ok({ holdings: rows, productOptions }, paginationMeta(input.page, input.limit, total))
})
