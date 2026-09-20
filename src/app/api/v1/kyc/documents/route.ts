// ============================================
// Zar30 - POST /api/v1/kyc/documents
// ============================================
// آپلود مدرک (multipart) — MIME sniff + size cap + AES-256-GCM + private bucket
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, getClientIp } from '@/lib/api/request'
import { ApiError } from '@/lib/errors/api-error'
import { requireAuth } from '@/lib/auth/guard'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { kycService } from '@/lib/services/kyc.service'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('kyc.upload', getClientIp(req) ?? auth.userId)

  const form = await req.formData().catch(() => null)
  if (!form) throw ApiError.badRequest('بدنه multipart نامعتبر است')

  const kind = form.get('kind')
  const file = form.get('file')
  if (typeof kind !== 'string' || !(file instanceof File)) {
    throw ApiError.badRequest('فیلدهای kind و file الزامی هستند')
  }

  const data = Buffer.from(await file.arrayBuffer())
  const doc = await kycService.uploadDocument(
    auth.userId,
    kind,
    file.name || 'document',
    file.type || '',
    data,
    getSessionMeta(req),
  )
  return ok({ document: doc }, undefined, 201)
})
