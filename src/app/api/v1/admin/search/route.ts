// ============================================
// Zar30 - GET /api/v1/admin/search?q=
// ============================================
// جستجوی سراسری ادمین — ورود احراز ادمین است؛ سطح نتیجه permission-aware
// ============================================

import { z } from 'zod'
import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { searchAdminEntities } from '@/lib/services/admin-search.service'

const querySchema = z.object({
  q: z.string().trim().min(2, 'عبارت جستجو باید حداقل ۲ نویسه باشد').max(80),
})

export const GET = withErrorHandler(async (req: Request) => {
  const admin = await requireAdmin(req)
  const parsed = querySchema.safeParse({
    q: new URL(req.url).searchParams.get('q') ?? '',
  })
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامتر جستجو نامعتبر است')
  }
  const results = await searchAdminEntities(parsed.data.q, admin.permissions)
  return ok({ results })
})
