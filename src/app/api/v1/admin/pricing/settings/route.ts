// ============================================
// Zar30 - /api/v1/admin/pricing/settings
// ============================================
// GET  → تنظیمات فعلی قیمت‌گذاری (با مقدار fallback و منبع هر مقدار)
// PUT  → به‌روزرسانی تنظیمات — permission: pricing.update — strict audit
// مقادیر در PlatformSetting ذخیره می‌شوند؛ تا ۳۰s بعد اعمال می‌شوند (کش).
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { writeAuditStrict } from '@/lib/audit/audit'
import { toJsonSafe } from '@/lib/finance/money'
import {
  getPriceMaxAgeMinutes,
  getPriceMaxDeviationPercent,
  getSellDiscountToman,
  invalidatePlatformConfigCache,
} from '@/lib/config/platform-config'
import prisma from '@/lib/db/prisma'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.PRICING_READ)

  const [sellDiscountToman, maxAgeMinutes, maxDeviationPercent] = await Promise.all([
    getSellDiscountToman(),
    getPriceMaxAgeMinutes(),
    getPriceMaxDeviationPercent(),
  ])

  // منبع هر مقدار — آیا ادمین بازنویسی کرده یا env fallback است؟
  const keys = [
    'pricing.sell_discount_toman',
    'pricing.max_age_minutes',
    'pricing.max_deviation_percent',
  ]
  const rows = await prisma.platformSetting.findMany({ where: { key: { in: keys } } })
  const overridden = new Set(rows.map((r) => r.key))

  return ok({
    settings: {
      sellDiscountToman: sellDiscountToman.toString(),
      maxAgeMinutes,
      maxDeviationPercent,
      sources: {
        sellDiscountToman: overridden.has('pricing.sell_discount_toman') ? 'admin' : 'env',
        maxAgeMinutes: overridden.has('pricing.max_age_minutes') ? 'admin' : 'env',
        maxDeviationPercent: overridden.has('pricing.max_deviation_percent') ? 'admin' : 'env',
      },
    },
  })
})

const pricingSettingsSchema = z
  .object({
    sellDiscountToman: z
      .number()
      .int('تخفیف فروش باید عدد صحیح باشد')
      .min(0, 'تخفیف فروش نمی‌تواند منفی باشد')
      .max(1_000_000_000, 'تخفیف فروش خارج از بازه مجاز است')
      .optional(),
    maxAgeMinutes: z
      .number()
      .int()
      .min(1, 'حداقل سن قیمت ۱ دقیقه است')
      .max(720, 'حداکثر سن قیمت ۷۲۰ دقیقه (۱۲ ساعت) است')
      .optional(),
    maxDeviationPercent: z
      .number()
      .min(0.1, 'حداقل انحراف مجاز ۰.۱٪ است')
      .max(100, 'حداکثر انحراف مجاز ۱۰۰٪ است')
      .optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'حداقل یک مقدار برای به‌روزرسانی لازم است',
  })

export const PUT = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.PRICING_UPDATE)
  const input = await parseBody(req, pricingSettingsSchema)

  const updates: { key: string; value: number }[] = []
  if (input.sellDiscountToman !== undefined) {
    updates.push({ key: 'pricing.sell_discount_toman', value: input.sellDiscountToman })
  }
  if (input.maxAgeMinutes !== undefined) {
    updates.push({ key: 'pricing.max_age_minutes', value: input.maxAgeMinutes })
  }
  if (input.maxDeviationPercent !== undefined) {
    updates.push({ key: 'pricing.max_deviation_percent', value: input.maxDeviationPercent })
  }

  const before: Record<string, unknown> = {}
  const existing = await prisma.platformSetting.findMany({
    where: { key: { in: updates.map((u) => u.key) } },
  })
  for (const row of existing) before[row.key] = row.value

  await prisma.$transaction(
    updates.map((u) =>
      prisma.platformSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      }),
    ),
  )

  invalidatePlatformConfigCache()

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'pricing.settings_update',
    entityType: 'platform_setting',
    entityId: 'pricing',
    before,
    after: toJsonSafe(Object.fromEntries(updates.map((u) => [u.key, u.value]))),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  const [sellDiscountToman, maxAgeMinutes, maxDeviationPercent] = await Promise.all([
    getSellDiscountToman(),
    getPriceMaxAgeMinutes(),
    getPriceMaxDeviationPercent(),
  ])

  return ok({
    settings: {
      sellDiscountToman: sellDiscountToman.toString(),
      maxAgeMinutes,
      maxDeviationPercent,
    },
  })
})
