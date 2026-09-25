// ============================================
// Zar30 - /api/v1/admin/delivery/settings
// ============================================
// GET → پیکربندی تحویل (هزینه/حداقل) — permission: settings.read
// PUT → ذخیره پیکربندی — permission: settings.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { toAuditData } from '@/lib/audit/audit'
import prisma from '@/lib/db/prisma'
import { adminDeliverySettingsSchema } from '@/lib/validators/admin-delivery'
import { getDeliveryConfig, setDeliveryConfig } from '@/lib/finance/delivery.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SETTINGS_READ)
  const config = await getDeliveryConfig()
  return ok({
    config: {
      feePost: config.feePost.toString(),
      feePickup: config.feePickup.toString(),
      minGrams: config.minGrams,
    },
  })
})

export const PUT = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SETTINGS_MANAGE)
  const body = await parseBody(req, adminDeliverySettingsSchema)
  const before = await getDeliveryConfig()
  const config = await setDeliveryConfig(admin.adminId, body)

  const meta = getSessionMeta(req)
  await prisma.auditLog.create({
    data: toAuditData({
      actorType: 'admin',
      actorId: admin.adminId,
      actorRole: admin.adminRole,
      action: 'settings.delivery.update',
      entityType: 'settings',
      entityId: 'delivery.config',
      before: {
        feePost: before.feePost.toString(),
        feePickup: before.feePickup.toString(),
        minGrams: before.minGrams,
      },
      after: {
        feePost: config.feePost.toString(),
        feePickup: config.feePickup.toString(),
        minGrams: config.minGrams,
      },
      ip: meta.ip,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    }),
  })

  return ok({
    config: {
      feePost: config.feePost.toString(),
      feePickup: config.feePickup.toString(),
      minGrams: config.minGrams,
    },
  })
})
