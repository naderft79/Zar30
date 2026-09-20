import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminPlatformQuerySchema } from '@/lib/validators/admin-operations'
import { listAdminContent } from '@/lib/services/admin-platform.service'
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.CONTENT_READ)
  const input = parseAdminQuery(req, adminPlatformQuerySchema)
  const result = await listAdminContent(input)
  return ok({ contents: result.rows }, paginationMeta(input.page, input.limit, result.total))
})
