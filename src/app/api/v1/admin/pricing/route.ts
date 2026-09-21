// ============================================
// Zar30 - GET /api/v1/admin/pricing
// ============================================
// تاریخچه قیمت‌گذاری طلا + آخرین قیمت — read-only — permission: pricing.read
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { writeAuditStrict } from '@/lib/audit/audit'
import { adminPricingListQuerySchema } from '@/lib/validators/admin-finance'
import { adminRecordPriceSchema } from '@/lib/validators/finance'
import { listAdminPrices } from '@/lib/services/admin-finance.service'
import { recordPrice } from '@/lib/finance/pricing.service'
import { toJsonSafe } from '@/lib/finance/money'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)
  const parsed = adminPricingListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  )
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total, latest } = await listAdminPrices(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { prices: rows, latest },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})

// POST → ثبت قیمت جدید — permission: pricing.update — strict audit
export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const input = await parseBody(req, adminRecordPriceSchema)

  const price = await recordPrice({
    buyPrice: input.buyPrice,
    sellPrice: input.sellPrice,
    source: input.source,
  })

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'pricing.record',
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

  return created({
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
