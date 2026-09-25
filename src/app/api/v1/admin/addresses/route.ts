// ============================================
// Zar30 - GET /api/v1/admin/addresses
// ============================================
// لیست آدرس‌های کاربران — read-only — permission: addresses.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminAddressListQuerySchema } from '@/lib/validators/admin-ops'
import { listAdminAddresses } from '@/lib/services/admin-ops.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.ADDRESSES_READ)
  const input = parseAdminQuery(req, adminAddressListQuerySchema)
  const { rows, total } = await listAdminAddresses(input)
  return ok({ addresses: rows }, paginationMeta(input.page, input.limit, total))
})
