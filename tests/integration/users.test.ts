// ============================================
// Zar30 - User Service Integration Tests (Phase 3)
// ============================================
// Profile / Sessions / Notifications روی PostgreSQL واقعی
// تمرکز: User Isolation — هیچ کاربری به داده کاربر دیگر دسترسی ندارد
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp, login, listSessions } from '@/lib/services/auth.service'
import {
  getUserProfile,
  updateProfile,
  listUserSessions,
  revokeUserSessionById,
  revokeOtherSessions,
  listNotifications,
  markNotificationRead,
  listSecurityEvents,
} from '@/lib/services/user.service'
import { verifyRefreshToken } from '@/lib/auth/jwt'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function readDevOtp(mobile: string): Promise<string> {
  const code = await redis.get(`devotp:${mobile}`)
  expect(code, `OTP برای ${mobile} در Redis یافت نشد`).toBeTruthy()
  return code!
}

async function createVerifiedUser(mobile = uniqueMobile()) {
  await register({ mobile, password: 'Test@1234' }, meta)
  const code = await readDevOtp(mobile)
  await verifyRegisterOtp(mobile, code, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

describe('User Service (DB واقعی)', () => {
  it('getUserProfile — profile کاربر برمی‌گردد', async () => {
    const user = await createVerifiedUser()
    const profile = await getUserProfile(user.id)
    expect(profile.id).toBe(user.id)
    expect(profile.mobile).toBe(user.mobile)
    expect(profile.kycLevel).toBe('LEVEL_1')
    expect(profile.referralCode).toBeTruthy()
  })

  it('getUserProfile — کاربر ناموجود unauthorized است', async () => {
    await expect(getUserProfile('00000000-0000-0000-0000-000000000000')).rejects.toThrow()
  })

  it('updateProfile — نام/ایمیل واقعی ذخیره می‌شود و audit ثبت می‌گردد', async () => {
    const user = await createVerifiedUser()
    const updated = await updateProfile(
      user.id,
      { firstName: 'تست', lastName: 'کاربر', email: 'u@test.ir' },
      meta,
    )
    expect(updated.firstName).toBe('تست')
    expect(updated.email).toBe('u@test.ir')

    const audit = await prisma.auditLog.findFirst({
      where: { actorId: user.id, action: 'PROFILE_UPDATE' },
    })
    expect(audit).toBeTruthy()
  })

  it('updateProfile — mobile قابل تغییر از این مسیر نیست', async () => {
    const user = await createVerifiedUser()
    const updated = await updateProfile(user.id, { firstName: 'جدید' }, meta)
    expect(updated.mobile).toBe(user.mobile)
  })

  it('listUserSessions — isCurrent فقط برای نشست جاری است', async () => {
    const user = await createVerifiedUser()
    const auth1 = await login({ mobile: user.mobile, password: 'Test@1234' }, meta)
    const auth2 = await login({ mobile: user.mobile, password: 'Test@1234' }, meta)
    const sid1 = (await verifyRefreshToken(auth1.refreshToken)).sid
    const sid2 = (await verifyRefreshToken(auth2.refreshToken)).sid

    const sessions = await listUserSessions(user.id, sid1)
    expect(sessions.length).toBe(2)
    expect(sessions.find((s) => s.id === sid1)!.isCurrent).toBe(true)
    expect(sessions.find((s) => s.id === sid2)!.isCurrent).toBe(false)
  })

  it('revokeUserSessionById — نشست کاربر دیگر 404 می‌شود (IDOR)', async () => {
    const userA = await createVerifiedUser()
    const userB = await createVerifiedUser()
    const authB = await login({ mobile: userB.mobile, password: 'Test@1234' }, meta)
    const sidB = (await verifyRefreshToken(authB.refreshToken)).sid

    // کاربر A نمی‌تواند نشست کاربر B را لغو کند
    await expect(revokeUserSessionById(userA.id, sidB, meta)).rejects.toThrow()

    // نشست کاربر B هنوز فعال است
    const sessionsB = await listSessions(userB.id)
    expect(sessionsB.length).toBe(1)

    // خود کاربر B می‌تواند لغو کند
    await revokeUserSessionById(userB.id, sidB, meta)
    expect((await listSessions(userB.id)).length).toBe(0)
  })

  it('revokeOtherSessions — نشست جاری حفظ و بقیه لغو می‌شوند', async () => {
    const user = await createVerifiedUser()
    const auth1 = await login({ mobile: user.mobile, password: 'Test@1234' }, meta)
    await login({ mobile: user.mobile, password: 'Test@1234' }, meta)
    await login({ mobile: user.mobile, password: 'Test@1234' }, meta)
    const sid1 = (await verifyRefreshToken(auth1.refreshToken)).sid

    const result = await revokeOtherSessions(user.id, sid1, meta)
    expect(result.revoked).toBe(2)

    const remaining = await listUserSessions(user.id, sid1)
    expect(remaining.length).toBe(1)
    expect(remaining[0]!.id).toBe(sid1)
    expect(remaining[0]!.isCurrent).toBe(true)
  })

  it('markNotificationRead — isolation: اعلان کاربر دیگر 404 می‌شود', async () => {
    const userA = await createVerifiedUser()
    const userB = await createVerifiedUser()

    const notifB = await prisma.notification.create({
      data: {
        userId: userB.id,
        type: 'system',
        title: 'تست',
        body: 'متن اعلان',
        channel: 'IN_APP',
      },
    })

    // کاربر A نمی‌تواند اعلان کاربر B را بخواند
    await expect(markNotificationRead(userA.id, notifB.id)).rejects.toThrow()

    // اعلان هنوز خوانده‌نشده است
    const check = await prisma.notification.findUnique({ where: { id: notifB.id } })
    expect(check!.readAt).toBeNull()

    // خود کاربر B می‌تواند — و دوبار خواندن idempotent است
    await markNotificationRead(userB.id, notifB.id)
    await markNotificationRead(userB.id, notifB.id)
    const after = await prisma.notification.findUnique({ where: { id: notifB.id } })
    expect(after!.readAt).not.toBeNull()
  })

  it('listNotifications — فقط اعلان‌های خود کاربر برمی‌گردد', async () => {
    const userA = await createVerifiedUser()
    const userB = await createVerifiedUser()
    await prisma.notification.createMany({
      data: [
        { userId: userA.id, type: 'system', title: 'A1', body: 'b', channel: 'IN_APP' },
        { userId: userB.id, type: 'system', title: 'B1', body: 'b', channel: 'IN_APP' },
      ],
    })
    const listA = await listNotifications(userA.id)
    expect(listA.every((n) => n.title.startsWith('A'))).toBe(true)
  })

  it('listSecurityEvents — فقط رویدادهای خود کاربر برمی‌گردد', async () => {
    const userA = await createVerifiedUser()
    await createVerifiedUser()

    const eventsA = await listSecurityEvents(userA.id)
    expect(eventsA.length).toBeGreaterThan(0)
    expect(eventsA.every((e) => e.action !== undefined)).toBe(true)

    // رویداد register/login کاربر A در لیست است
    const actions = eventsA.map((e) => e.action)
    expect(actions).toContain('USER_REGISTERED')
    expect(actions).toContain('MOBILE_VERIFIED')
  })
})
