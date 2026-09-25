// ============================================
// Zar30 - GET /api/v1/admin/profile
// ============================================
// پروفایل مدیر جاری — فقط ادمین فعال (بدون permission اضافی)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/guard'
import { getAdminProfile } from '@/lib/services/admin-system.service'

export const GET = withErrorHandler(async (req: Request) => {
  const admin = await requireAdmin(req)
  const profile = await getAdminProfile(admin.adminId)
  return ok({ profile })
})
