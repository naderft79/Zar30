import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminTicketQuerySchema } from '@/lib/validators/admin-operations'
import { listAdminTickets } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.TICKETS_READ)
  const input = parseAdminQuery(req, adminTicketQuerySchema)
  const result = await listAdminTickets(input)
  return ok({ tickets: result.rows }, paginationMeta(input.page, input.limit, result.total))
})
