// ============================================
// Zar30 - Auth Guard (Phase 2)
// ============================================
// Authorization server-side — هر endpoint حساس از این استفاده می‌کند
// Web (cookie) و Mobile (Bearer) هر دو پشتیبانی می‌شوند
// ============================================

import type { KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { verifyAccessToken } from './jwt'
import { ACCESS_COOKIE } from './cookies'

export interface AuthContext {
  userId: string
  mobile: string
  kycLevel: KycLevel
  sessionId?: string
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return null
}

function extractCookieToken(req: Request, name: string): string | null {
  const cookies = req.headers.get('cookie')
  if (!cookies) return null
  for (const part of cookies.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

// احراز هویت اجباری — در صورت ناموفق بودن، ApiError پرتاب می‌شود
export async function requireAuth(req: Request): Promise<AuthContext> {
  const token = extractBearerToken(req) ?? extractCookieToken(req, ACCESS_COOKIE)
  if (!token) throw ApiError.unauthorized()

  let payload
  try {
    payload = await verifyAccessToken(token)
  } catch {
    throw ApiError.unauthorized('توکن نامعتبر یا منقضی شده است')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, mobile: true, kycLevel: true, status: true },
  })
  if (!user || user.status === 'DELETED') throw ApiError.unauthorized()
  if (user.status === 'BLOCKED') throw ApiError.forbidden('حساب شما مسدود شده است')

  // نشست باید فعال باشد — revoke شدن بلافاصله روی access token هم اثر می‌کند
  if (payload.sid) {
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, expiresAt: true },
    })
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw ApiError.unauthorized('نشست شما منقضی یا لغو شده است')
    }
  }

  return {
    userId: user.id,
    mobile: user.mobile,
    kycLevel: user.kycLevel,
    sessionId: payload.sid || undefined,
  }
}

// دریافت اختیاری کاربر — برای endpointهایی که هم public و هم private رفتار می‌کنند
export async function getOptionalAuth(req: Request): Promise<AuthContext | null> {
  try {
    return await requireAuth(req)
  } catch {
    return null
  }
}

export interface AdminContext extends AuthContext {
  adminId: string
  adminRole: string
}

// احراز ادمین — کاربر احرازشده + رکورد فعال در admin_users
// صدور توکن ادمین در Phase مربوط به پنل ادمین می‌آید؛ این guard همان session کاربر را نیاز دارد
export async function requireAdmin(req: Request): Promise<AdminContext> {
  const auth = await requireAuth(req)
  const admin = await prisma.adminUser.findUnique({
    where: { userId: auth.userId },
    select: { id: true, role: true, active: true },
  })
  if (!admin || !admin.active) throw ApiError.forbidden('دسترسی ادمین لازم است')
  return { ...auth, adminId: admin.id, adminRole: admin.role }
}
