// ============================================
// Zar30 - /api/v1/admin/seo
// ============================================
// GET  → متادیتای SEO همه صفحات — seo.read
// POST → upsert متادیتای یک صفحه — seo.manage
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminSeoSchema } from '@/lib/validators/admin-system'
import { listAdminSeo, upsertAdminSeo } from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.SEO_READ)
  const pages = await listAdminSeo()
  return ok({ pages })
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.SEO_MANAGE)
  const body = await parseBody(req, adminSeoSchema)
  const result = await upsertAdminSeo(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return ok(result)
})
