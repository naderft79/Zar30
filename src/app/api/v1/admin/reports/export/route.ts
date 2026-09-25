// ============================================
// Zar30 - POST /api/v1/admin/reports/export
// ============================================
// تولید خروجی CSV — reports.export — پاسخ فایل دانلودی است نه JSON
// ============================================

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminExportSchema } from '@/lib/validators/admin-risk'
import { generateAdminExport } from '@/lib/services/admin-reports.service'

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.REPORTS_EXPORT)
  const body = await parseBody(req, adminExportSchema)
  const { filename, csv } = await generateAdminExport(
    { adminId: admin.adminId, adminRole: admin.adminRole },
    body,
    getSessionMeta(req),
  )
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})
