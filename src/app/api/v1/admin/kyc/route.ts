// ============================================
// Zar30 - GET /api/v1/admin/kyc
// ============================================
// لیست پرونده‌های KYC — pagination/filter/sort سمت سرور — permission: kyc.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { adminKycListQuerySchema } from '@/lib/validators/admin'
import { listAdminKyc } from '@/lib/services/admin-kyc.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.KYC_READ)
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const parsed = adminKycListQuerySchema.safeParse(params)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبرند')
  }
  const { rows, total } = await listAdminKyc(parsed.data)
  const { page, limit } = parsed.data
  return ok(
    { submissions: rows },
    { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  )
})
