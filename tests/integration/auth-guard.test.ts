// ============================================
// Zar30 - Auth Guard Integration Test (DB + JWT واقعی)
// ============================================
// requireAuth: Bearer (mobile) و cookie (web)، کاربر BLOCKED/DELETED،
//   نشست revoke/expired → unauthorized
// requireAdmin: رکورد admin + active؛ permission granular
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  requireAuth,
  getOptionalAuth,
  requireAdmin,
  requireAdminPermission,
} from '../../src/lib/auth/guard'
import { signAccessToken } from '../../src/lib/auth/jwt'
import { ACCESS_COOKIE } from '../../src/lib/auth/cookies'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function bearerReq(token: string) {
  return new Request('http://localhost/api/v1/test', {
    headers: { authorization: `Bearer ${token}` },
  })
}

function cookieReq(token: string) {
  return new Request('http://localhost/api/v1/test', {
    headers: { cookie: `${ACCESS_COOKIE}=${encodeURIComponent(token)}` },
  })
}

describe('Auth Guard (DB + JWT واقعی)', () => {
  let userId: string
  let sessionId: string
  let adminUserId: string
  let blockedUserId: string

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0931${suffix}`,
        passwordHash: 'test',
        referralCode: `G${suffix}A`,
        kycLevel: 'LEVEL_1',
      },
    })
    userId = u.id
    const s = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'x'.repeat(64),
        expiresAt: new Date(Date.now() + 86400_000),
      },
    })
    sessionId = s.id

    const au = await prisma.user.create({
      data: {
        mobile: `0932${suffix}`,
        passwordHash: 'test',
        referralCode: `G${suffix}B`,
        kycLevel: 'LEVEL_3',
      },
    })
    adminUserId = au.id
    await prisma.adminUser.create({
      data: { userId: au.id, role: 'SUPPORT', permissions: ['users.read'] },
    })

    const bu = await prisma.user.create({
      data: {
        mobile: `0933${suffix}`,
        passwordHash: 'test',
        referralCode: `G${suffix}C`,
        status: 'BLOCKED',
      },
    })
    blockedUserId = bu.id
  })

  afterAll(async () => {
    const allUsers = [userId, adminUserId, blockedUserId].filter(Boolean)
    await prisma.session.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.adminUser.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } })
  })

  async function tokenFor(uid: string, sid = sessionId) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: uid } })
    return signAccessToken({
      sub: uid,
      mobile: user.mobile,
      kycLevel: user.kycLevel,
      sid,
    })
  }

  it('بدون توکن → unauthorized؛ با توکن نامعتبر → unauthorized', async () => {
    await expect(requireAuth(new Request('http://localhost/'))).rejects.toMatchObject({
      statusCode: 401,
    })
    await expect(requireAuth(bearerReq('garbage.token.x'))).rejects.toMatchObject({
      statusCode: 401,
    })
    // optional auth همان مسیرها را null برمی‌گرداند
    expect(await getOptionalAuth(new Request('http://localhost/'))).toBeNull()
  })

  it('Bearer token معتبر → AuthContext کامل', async () => {
    const ctx = await requireAuth(bearerReq(await tokenFor(userId)))
    expect(ctx.userId).toBe(userId)
    expect(ctx.kycLevel).toBe('LEVEL_1')
    expect(ctx.sessionId).toBe(sessionId)
  })

  it('cookie token معتبر (web) → همان نتیجه Bearer', async () => {
    const ctx = await requireAuth(cookieReq(await tokenFor(userId)))
    expect(ctx.userId).toBe(userId)
  })

  it('کاربر BLOCKED → 403', async () => {
    const s = await prisma.session.create({
      data: {
        userId: blockedUserId,
        refreshTokenHash: 'y'.repeat(64),
        expiresAt: new Date(Date.now() + 86400_000),
      },
    })
    const token = await signAccessToken({
      sub: blockedUserId,
      mobile: 'x',
      kycLevel: 'LEVEL_0',
      sid: s.id,
    })
    await expect(requireAuth(bearerReq(token))).rejects.toMatchObject({ statusCode: 403 })
  })

  it('نشست revoke شده → 401', async () => {
    const s = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'z'.repeat(64),
        expiresAt: new Date(Date.now() + 86400_000),
        revokedAt: new Date(),
      },
    })
    await expect(requireAuth(bearerReq(await tokenFor(userId, s.id)))).rejects.toMatchObject({
      statusCode: 401,
    })
    // نشست منقضی هم همین‌طور
    const expired = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'w'.repeat(64),
        expiresAt: new Date(Date.now() - 1000),
      },
    })
    await expect(requireAuth(bearerReq(await tokenFor(userId, expired.id)))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('requireAdmin — کاربر عادی 403؛ ادمین فعال با permission ok', async () => {
    const s = await prisma.session.create({
      data: {
        userId: adminUserId,
        refreshTokenHash: 'v'.repeat(64),
        expiresAt: new Date(Date.now() + 86400_000),
      },
    })
    const adminToken = await signAccessToken({
      sub: adminUserId,
      mobile: 'x',
      kycLevel: 'LEVEL_3',
      sid: s.id,
    })
    const ctx = await requireAdmin(bearerReq(adminToken))
    expect(ctx.adminRole).toBe('SUPPORT')
    expect(ctx.permissions).toContain('users.read')

    // permission granular — users.read دارد، finance.write ندارد
    await expect(
      requireAdminPermission(bearerReq(adminToken), 'users.read'),
    ).resolves.toMatchObject({ adminRole: 'SUPPORT' })
    await expect(
      requireAdminPermission(bearerReq(adminToken), 'settings.manage'),
    ).rejects.toMatchObject({ statusCode: 403 })

    // کاربر عادی ادمین نیست
    await expect(requireAdmin(bearerReq(await tokenFor(userId)))).rejects.toMatchObject({
      statusCode: 403,
    })
  })
})
