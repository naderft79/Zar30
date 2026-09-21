// ============================================
// Zar30 - POST /api/v1/admin/pricing/sync
// ============================================
// همگام‌سازی دستی قیمت زنده از provider خارجی — permission: pricing.update
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { writeAuditStrict } from '@/lib/audit/audit'
import { syncLivePrice } from '@/lib/finance/pricing.service'
import { toJsonSafe } from '@/lib/finance/money'

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const price = await syncLivePrice()

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'pricing.sync',
    entityType: 'gold_price',
    entityId: price.id,
    after: toJsonSafe({
      buyPrice: price.buyPrice,
      sellPrice: price.sellPrice,
      source: price.source,
    }),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  return ok({
    price: {
      id: price.id,
      buyPrice: price.buyPrice.toString(),
      sellPrice: price.sellPrice.toString(),
      spread: price.spread.toString(),
      source: price.source,
      recordedAt: price.recordedAt,
    },
  })
})
