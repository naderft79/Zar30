// ============================================
// Zar30 - GET /api/v1/admin/transfers
// ============================================
// لیست انتقال‌های داخلی بین کاربران — permission: transfers.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminTransferListQuerySchema } from '@/lib/validators/admin-ops'
import { listAdminTransfers } from '@/lib/services/admin-ops.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.TRANSFERS_READ)
  const input = parseAdminQuery(req, adminTransferListQuerySchema)
  const { rows, total } = await listAdminTransfers(input)
  return ok({ transfers: rows }, paginationMeta(input.page, input.limit, total))
})
