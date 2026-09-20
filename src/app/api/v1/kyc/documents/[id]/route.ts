// ============================================
// Zar30 - GET/DELETE /api/v1/kyc/documents/:id
// ============================================
// GET: دانلود مدرک — فقط مالک یا ادمین؛ decrypt + no-store
// DELETE: حذف مدرک — فقط مالک، فقط در draft
// ============================================

import { NextResponse } from 'next/server'
import { noContent, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAuth } from '@/lib/auth/guard'
import { kycService } from '@/lib/services/kyc.service'
import prisma from '@/lib/db/prisma'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const auth = await requireAuth(req)
  const { id } = await ctx.params

  // ادمین فعال → دسترسی بررسی؛ کاربر عادی → فقط مالک
  const admin = await prisma.adminUser.findUnique({
    where: { userId: auth.userId },
    select: { active: true },
  })
  const doc = await kycService.getDocument(auth.userId, id, !!admin?.active)

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
