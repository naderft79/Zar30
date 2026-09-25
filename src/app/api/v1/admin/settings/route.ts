// ============================================
// Zar30 - /api/v1/admin/settings
// ============================================
// GET  → لیست تنظیمات (?q= &prefix=) — settings.read
// POST → upsert تنظیم — settings.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminSettingSchema } from '@/lib/validators/admin-system'
import { listAdminSettings, upsertAdminSetting } from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SETTINGS_READ)
  const url = new URL(req.url)
  const settings = await listAdminSettings(
    url.searchParams.get('q') ?? undefined,
    url.searchParams.get('prefix') ?? undefined,
  )
  return ok({ settings })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SETTINGS_MANAGE)
  const body = await parseBody(req, adminSettingSchema)
  const result = await upsertAdminSetting(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return ok(result)
})
