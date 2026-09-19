// ============================================
// Zar30 - User Service (Phase 3: User Panel)
// ============================================
// Profile / Sessions / Notifications / Security events
// تمام عملیات فقط روی userId استخراج‌شده از token — isolation سرور
// ============================================

import type { User } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { writeAudit } from '@/lib/audit/audit'
import { revokeSession, revokeAllUserSessions, revokeAllOtherSessions } from '@/lib/auth/session'
import { parseUserAgent } from '@/lib/utils/user-agent'
import type { SessionMeta } from '@/lib/auth/session'
import type { ProfileUpdateInput } from '@/lib/validators/users'

export interface UserProfile {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  email: string | null
  avatarUrl: string | null
  kycLevel: string
  status: string
  referralCode: string
  referredById: string | null
  mobileVerifiedAt: Date | null
  lastLoginAt: Date | null
  createdAt: Date
}

export interface SessionView {
  id: string
  ip: string | null
  userAgent: string | null
  device: string
  os: string
  browser: string
  isCurrent: boolean
  createdAt: Date
  expiresAt: Date
}

export interface NotificationView {
  id: string
  type: string
  title: string
  body: string
  channel: string
  read: boolean
  createdAt: Date
}

function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    mobile: user.mobile,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    kycLevel: user.kycLevel,
    status: user.status,
    referralCode: user.referralCode,
    referredById: user.referredById,
    mobileVerifiedAt: user.mobileVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.unauthorized()
  return toUserProfile(user)
}

// به‌روزرسانی profile — فقط فیلدهای غیرحساس هویتی (mobile/kyc/status دست‌نخورده)
export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
  meta: SessionMeta,
): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.unauthorized()
  if (user.status === 'BLOCKED') throw ApiError.forbidden('حساب شما مسدود شده است')

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      email: input.email ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
    },
  })

  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'PROFILE_UPDATE',
    entityType: 'user',
    entityId: userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return toUserProfile(updated)
}

// نشست‌های فعال — با تجزیه device/browser و برچسب نشست جاری
export async function listUserSessions(
  userId: string,
  currentSid?: string,
): Promise<SessionView[]> {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      deviceInfo: true,
      createdAt: true,
      expiresAt: true,
    },
  })
  return sessions.map((s) => {
    const parsed = parseUserAgent(s.deviceInfo ?? s.userAgent ?? '')
    return {
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      device: parsed.device,
      os: parsed.os,
      browser: parsed.browser,
      isCurrent: s.id === currentSid,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }
  })
}

// لغو همه نشست‌های دیگر — نشست جاری حفظ می‌شود (Logout Others)
export async function revokeOtherSessions(
  userId: string,
  currentSid: string | undefined,
  meta: SessionMeta,
) {
  const count = await revokeAllOtherSessions(userId, currentSid)
  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'SESSION_REVOKE_OTHERS',
    entityType: 'session',
    ip: meta.ip,
    userAgent: meta.userAgent,
    after: { revokedCount: count },
  })
  return { revoked: count }
}

// خروج از همه نشست‌ها شامل جاری (Logout All)
export async function revokeAllSessions(userId: string, meta: SessionMeta) {
  await revokeAllUserSessions(userId)
  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'SESSION_REVOKE_ALL',
    entityType: 'session',
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { revoked: true }
}

// ---- Notifications ----

export async function listNotifications(userId: string): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      channel: true,
      readAt: true,
      createdAt: true,
    },
  })
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    channel: n.channel,
    read: n.readAt !== null,
    createdAt: n.createdAt,
  }))
}

export async function markNotificationRead(userId: string, id: string) {
  // فقط notification خود کاربر — isolation؛ اگر قبلاً خوانده شده باشد idempotent است
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true, readAt: true },
  })
  if (!notification) throw ApiError.notFound('اعلان یافت نشد')
  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })
  }
  return { read: true }
}

// رویدادهای امنیتی اخیر کاربر — از audit_logs
export async function listSecurityEvents(userId: string) {
  const events = await prisma.auditLog.findMany({
    where: { actorId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      action: true,
      ip: true,
      userAgent: true,
      createdAt: true,
    },
  })
  return events
}

// لغو یک نشست — فقط نشست خود کاربر (همان منطق auth.service، اینجا برای users domain)
export async function revokeUserSessionById(userId: string, sessionId: string, meta: SessionMeta) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) {
    throw ApiError.notFound('نشست یافت نشد')
  }
  await revokeSession(sessionId)
  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'SESSION_REVOKE',
    entityType: 'session',
    entityId: sessionId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { revoked: true }
}

// Aggregation object برای import یکجا در route handlers
export const userService = {
  getUserProfile,
  updateProfile,
  listUserSessions,
  revokeOtherSessions,
  revokeAllSessions,
  listNotifications,
  markNotificationRead,
  listSecurityEvents,
  revokeUserSessionById,
}
