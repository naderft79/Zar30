import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminInstallmentQuerySchema } from '@/lib/validators/admin-operations'
import { listAdminInstallments } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)
  const input = parseAdminQuery(req, adminInstallmentQuerySchema)
  const result = await listAdminInstallments(input)
  return ok({ contracts: result.rows }, paginationMeta(input.page, input.limit, result.total))
})
