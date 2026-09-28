// ============================================
// Zar30 - GET /api/v1/admin/dashboard/queues/:key
// ============================================
// ۵ ردیف آخر هر صف — permission مخصوص هر صف — کش Redis ۱۵s
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getQueueRows } from '@/lib/services/admin-dashboard.service'
import { dashboardQueueKeySchema } from '@/lib/validators/admin-dashboard'
import { withCache } from '@/lib/cache/dashboard-cache'
import type { Permission } from '@/lib/auth/rbac'
import type { QueueKey } from '@/lib/config/admin-sla'

const QUEUE_PERMISSION: Record<QueueKey, Permission> = {
  kyc: PERMISSIONS.KYC_READ,
  withdrawals: PERMISSIONS.WITHDRAWALS_READ,
  orders: PERMISSIONS.ORDERS_READ,
  tickets: PERMISSIONS.TICKETS_READ,
  delivery: PERMISSIONS.DELIVERY_READ,
  risk: PERMISSIONS.RISK_READ,
  zareesi: PERMISSIONS.DELIVERY_READ,
}

export const GET = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const { key: rawKey } = await ctx.params
    const parsed = dashboardQueueKeySchema.safeParse(rawKey)
    if (!parsed.success) throw ApiError.badRequest('کلید صف نامعتبر است')
    const key = parsed.data

    await requireAdminPermission(req, QUEUE_PERMISSION[key])
    const { data: rows } = await withCache(`queue:${key}`, 15, () => getQueueRows(key))
    return ok({ rows })
  },
)
