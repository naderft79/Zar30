import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminReferralQuerySchema } from '@/lib/validators/admin-operations'
import { listAdminReferrals } from '@/lib/services/admin-operations.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.REFERRALS_READ)
  const input = parseAdminQuery(req, adminReferralQuerySchema)
  const result = await listAdminReferrals(input)
  return ok({ referrals: result.rows }, paginationMeta(input.page, input.limit, result.total))
})
