import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminInvestmentQuerySchema } from '@/lib/validators/admin-operations'
import { listAdminInvestments } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.INVESTMENTS_READ)
  const input = parseAdminQuery(req, adminInvestmentQuerySchema)
  const result = await listAdminInvestments(input)
  return ok({ positions: result.rows }, paginationMeta(input.page, input.limit, result.total))
})
