// ============================================
// Zar30 - GET /api/v1/admin/me
// ============================================
// هویت ادمین جاری + permissionهای resolve‌شده — فقط ادمین فعال
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/guard'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'

export const GET = withErrorHandler(async (req: Request) => {
  const admin = await requireAdmin(req)
  const user = await prisma.user.findUnique({
    where: { id: admin.userId },
    select: { firstName: true, lastName: true, mobile: true },
  })
  if (!user) throw ApiError.unauthorized()
  return ok({
    admin: {
      id: admin.adminId,
      userId: admin.userId,
      role: admin.adminRole,
      permissions: admin.permissions,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
    },
  })
})
