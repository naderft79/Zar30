// ============================================
// Zar30 - /api/v1/admin/installments/settings
// ============================================
// GET → تنظیمات سراسری اقساطی (کارمزدها + جریمه دیرکرد) با منبع هر مقدار
// PUT → به‌روزرسانی — permission: installments.manage — strict audit
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
  getInstallmentBuyFeePercent,
  getInstallmentGatewayFeePercent,
  getLateFeeDailyPercent,
  invalidatePlatformConfigCache,
} from '@/lib/config/platform-config'
import prisma from '@/lib/db/prisma'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)

  const [buyFeePercent, gatewayFeePercent, lateFeeDailyPercent] = await Promise.all([
    getInstallmentBuyFeePercent(),
    getInstallmentGatewayFeePercent(),
    getLateFeeDailyPercent(),
  ])

  const keys = [
    'installment.buy_fee_percent',
    'installment.gateway_fee_percent',
    'installment.late_fee_daily_percent',
  ]
  const rows = await prisma.platformSetting.findMany({ where: { key: { in: keys } } })
  const overridden = new Set(rows.map((r) => r.key))

  return ok({
    settings: {
      buyFeePercent,
      gatewayFeePercent,
      lateFeeDailyPercent,
      sources: {
        buyFeePercent: overridden.has('installment.buy_fee_percent') ? 'admin' : 'env',
        gatewayFeePercent: overridden.has('installment.gateway_fee_percent') ? 'admin' : 'env',
        lateFeeDailyPercent: overridden.has('installment.late_fee_daily_percent') ? 'admin' : 'env',
      },
    },
  })
})

const settingsSchema = z
  .object({
    /** کارمزد خرید — درصد از اعتبار */
    buyFeePercent: z
      .number()
      .min(0, 'کارمزد خرید نمی‌تواند منفی باشد')
      .max(10, 'کارمزد خرید حداکثر ۱۰٪ است')
      .optional(),
    /** کارمزد درگاه — درصد از اعتبار */
    gatewayFeePercent: z
      .number()
      .min(0, 'کارمزد درگاه نمی‌تواند منفی باشد')
      .max(5, 'کارمزد درگاه حداکثر ۵٪ است')
      .optional(),
    /** جریمه دیرکرد — درصد روزانه */
    lateFeeDailyPercent: z
      .number()
      .min(0, 'جریمه دیرکرد نمی‌تواند منفی باشد')
      .max(5, 'جریمه دیرکرد حداکثر ۵٪ روزانه است')
      .optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'حداقل یک مقدار برای به‌روزرسانی لازم است',
  })

export const PUT = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_MANAGE)
  const input = await parseBody(req, settingsSchema)

  const updates: { key: string; value: number }[] = []
  if (input.buyFeePercent !== undefined) {
    updates.push({ key: 'installment.buy_fee_percent', value: input.buyFeePercent })
  }
  if (input.gatewayFeePercent !== undefined) {
    updates.push({ key: 'installment.gateway_fee_percent', value: input.gatewayFeePercent })
  }
  if (input.lateFeeDailyPercent !== undefined) {
    updates.push({ key: 'installment.late_fee_daily_percent', value: input.lateFeeDailyPercent })
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
    action: 'installment.settings_update',
    entityType: 'platform_setting',
    entityId: 'installment',
    before,
    after: toJsonSafe(Object.fromEntries(updates.map((u) => [u.key, u.value]))),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  const [buyFeePercent, gatewayFeePercent, lateFeeDailyPercent] = await Promise.all([
    getInstallmentBuyFeePercent(),
    getInstallmentGatewayFeePercent(),
    getLateFeeDailyPercent(),
  ])

  return ok({
    settings: { buyFeePercent, gatewayFeePercent, lateFeeDailyPercent },
  })
})
