// ============================================
// Zar30 - GET /api/v1/admin/users
// ============================================
// لیست کاربران — pagination/filter/sort سمت سرور — permission: users.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminUserListQuerySchema } from '@/lib/validators/admin'
import { listAdminUsers } from '@/lib/services/admin-user.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.USERS_READ)
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const parsed = adminUserListQuerySchema.safeParse(params)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminUsers(parsed.data)
  const { page, limit } = parsed.data
  return ok({ users: rows }, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 })
})
