// ============================================
// Zar30 - Session Management (Phase 2)
// ============================================
// Refresh rotation + Reuse detection + Revocation
// Session hash = sha256(refresh token) — token خام هرگز در DB ذخیره نمی‌شود
// ============================================

import { createHash, randomUUID } from 'crypto'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { signRefreshToken, verifyRefreshToken } from './jwt'
import { logger } from '@/lib/logger/logger'
import { writeAudit } from '@/lib/audit/audit'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface SessionMeta {
  ip?: string
  userAgent?: string
  deviceInfo?: string
  requestId?: string
}

// ایجاد Session جدید — هر Session یک refresh token مستقل دارد
export async function createSession(userId: string, meta: SessionMeta) {
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: 'pending',
      ip: meta.ip,
      userAgent: meta.userAgent,
      deviceInfo: meta.deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  const refreshToken = await signRefreshToken({
    sub: userId,
    sid: session.id,
    jti: randomUUID(),
  })
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  })
  return { session, refreshToken }
}

export interface RotationResult {
  userId: string
  sessionId: string
  refreshToken: string
}

// Rotation + Reuse detection:
// - token معتبر → Session قبلی revoke و Session جدید صادر می‌شود
// - token متعلق به Session revoked → حملات Replay است → کل Sessionهای کاربر لغو می‌شود
export async function rotateSession(
  refreshToken: string,
  meta: SessionMeta,
): Promise<RotationResult> {
  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized('توکن refresh نامعتبر است')
  }

  const tokenHash = hashToken(refreshToken)
  const session = await prisma.session.findUnique({ where: { id: payload.sid } })

  if (!session || session.refreshTokenHash !== tokenHash) {
    throw ApiError.unauthorized('توکن refresh نامعتبر است')
  }

  if (session.revokedAt || session.expiresAt < new Date()) {
    // Reuse detected — توکن rotated دوباره استفاده شده
    await revokeAllUserSessions(session.userId)
    await writeAudit({
      action: 'SECURITY_SESSION_REUSE',
      actorType: 'user',
      actorId: session.userId,
      entityType: 'session',
      entityId: session.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    logger.warn(
      { userId: session.userId, sessionId: session.id },
      'Refresh token reuse detected — all sessions revoked',
    )
    throw ApiError.unauthorized('نشست شما به دلایل امنیتی لغو شد — دوباره وارد شوید')
  }

  // Rotation: revoke قدیمی + ایجاد جدید — همه در یک transaction
  const rotated = await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    })
    const newSession = await tx.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: 'pending',
        ip: meta.ip,
        userAgent: meta.userAgent,
        deviceInfo: meta.deviceInfo,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    return newSession
  })

  const newToken = await signRefreshToken({
    sub: rotated.userId,
    sid: rotated.id,
    jti: randomUUID(),
  })
  await prisma.session.update({
    where: { id: rotated.id },
    data: { refreshTokenHash: hashToken(newToken) },
  })

  return { userId: rotated.userId, sessionId: rotated.id, refreshToken: newToken }
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllOtherSessions(userId: string, keepSessionId?: string) {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId ?? '__none__' } },
    data: { revokedAt: new Date() },
  })
  return result.count
}
