// ============================================
// Zar30 - GET /api/v1/admin/nav-badges
// ============================================
// شمارنده‌های pending برای badgeهای ناوبری — فقط دامنه‌های مجاز
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/guard'
import { getAdminNavBadges } from '@/lib/services/admin-dashboard.service'

export const GET = withErrorHandler(async (req: Request) => {
  const admin = await requireAdmin(req)
  const badges = await getAdminNavBadges(admin.permissions)
  return ok({ badges })
})
