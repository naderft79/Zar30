// ============================================
// Zar30 - GET/DELETE /api/v1/kyc/documents/:id
// ============================================
// GET: دانلود مدرک — مالک یا ادمین دارای kyc.read؛ decrypt + no-store
// هر مشاهده با writeAuditStrict ثبت می‌شود (fail-closed پیش از ارسال پاسخ)
// DELETE: حذف مدرک — فقط مالک، فقط در draft
// ============================================

import { NextResponse } from 'next/server'
import { noContent, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAuth, requireAdminPermission, type AdminContext } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { writeAuditStrict } from '@/lib/audit/audit'
import { kycService } from '@/lib/services/kyc.service'
import prisma from '@/lib/db/prisma'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const auth = await requireAuth(req)
  const { id } = await ctx.params

  // metadata lookup — مالکیت مشخص شود قبل از دسترسی
  const meta = await prisma.kycDocument.findUnique({
    where: { id },
    select: { kind: true, submission: { select: { userId: true } } },
  })
  if (!meta) throw ApiError.notFound('مدرک یافت نشد')
  const ownerId = meta.submission.userId

  let doc: { data: Buffer; mimeType: string; fileName: string }
  if (ownerId === auth.userId) {
    // مسیر مالک — مشاهده مدرک خودش هم audit می‌شود
    doc = await kycService.getDocument(auth.userId, id, false)
    await writeAuditStrict({
      actorType: 'user',
      actorId: auth.userId,
      action: 'KYC_DOCUMENT_VIEWED',
      entityType: 'kyc_document',
      entityId: id,
      targetUserId: auth.userId,
      after: { kind: meta.kind },
      ...getSessionMeta(req),
    })
  } else {
    // مسیر ادمین — خطای auth به 404 تبدیل می‌شود تا وجود doc لو نرود (IDOR)
    let admin: AdminContext
    try {
      admin = await requireAdminPermission(req, PERMISSIONS.KYC_READ)
    } catch (error) {
      if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
        throw ApiError.notFound('مدرک یافت نشد')
      }
      throw error
    }
    doc = await kycService.getDocument(admin.userId, id, true)
    await writeAuditStrict({
      actorType: 'admin',
      actorId: admin.adminId,
      actorRole: admin.adminRole,
      action: 'KYC_DOCUMENT_VIEWED',
      entityType: 'kyc_document',
      entityId: id,
      targetUserId: ownerId,
      after: { kind: meta.kind },
      ...getSessionMeta(req),
    })
  }

  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="document"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const auth = await requireAuth(req)
  const { id } = await ctx.params
  await kycService.deleteDocument(auth.userId, id, getSessionMeta(req))
  return noContent()
})
