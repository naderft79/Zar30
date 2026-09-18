// ============================================
// Zarnama - Auth Integration Tests (Phase 2)
// ============================================
// جریان کامل روی PostgreSQL + Redis واقعی:
// Register → OTP → Verify → Login → Session → Logout → Revoke
// + Security: Brute Force, OTP Replay, Expired/Wrong OTP, Isolation
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import {
  register,
  verifyRegisterOtp,
  login,
  logout,
  listSessions,
  revokeUserSession,
  resetPassword,
  requestPasswordReset,
} from '@/lib/services/auth.service'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { rotateSession } from '@/lib/auth/session'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }

function uniqueMobile() {
  // شماره موبایل ایرانی یکتا برای هر تست
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function readDevOtp(mobile: string): Promise<string> {
  const code = await redis.get(`devotp:${mobile}`)
  expect(code, `OTP برای ${mobile} در Redis یافت نشد`).toBeTruthy()
  return code!
}

async function registerAndVerify(mobile: string, password = 'Test@1234') {
  await register({ mobile, password }, meta)
  const code = await readDevOtp(mobile)
  await verifyRegisterOtp(mobile, code, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

describe('Auth Flow (DB واقعی)', () => {
  it('Register → OTP → Verify → Login → Logout', async () => {
    const mobile = uniqueMobile()
    const password = 'Test@1234'

    // ثبت‌نام
    const reg = await register({ mobile, password }, meta)
    expect(reg.otpSent).toBe(true)

    // کاربر قبل از تایید موبایل نمی‌تواند وارد شود
    await expect(login({ mobile, password }, meta)).rejects.toThrow()

    // تایید OTP → KYC LEVEL_1
    const code = await readDevOtp(mobile)
    const verified = await verifyRegisterOtp(mobile, code, meta)
    expect(verified.kycLevel).toBe('LEVEL_1')

    // ورود
    const auth = await login({ mobile, password }, meta)
    expect(auth.accessToken).toBeTruthy()
    expect(auth.refreshToken).toBeTruthy()
    expect(auth.user.mobile).toBe(mobile)

    // خروج — Session revoke می‌شود
    const payload = await verifyRefreshToken(auth.refreshToken)
    const sessions = await listSessions(auth.user.id)
    expect(sessions.length).toBe(1)
    await logout(payload.sid, auth.user.id, meta)
    expect((await listSessions(auth.user.id)).length).toBe(0)
  })

  it('OTP Replay — کد مصرف‌شده دوباره کار نمی‌کند', async () => {
    const mobile = uniqueMobile()
    await register({ mobile, password: 'Test@1234' }, meta)
    const code = await readDevOtp(mobile)
    await verifyRegisterOtp(mobile, code, meta)
    await expect(verifyRegisterOtp(mobile, code, meta)).rejects.toThrow()
  })

  it('Wrong OTP — کد اشتباه attempts را افزایش می‌دهد', async () => {
    const mobile = uniqueMobile()
    await register({ mobile, password: 'Test@1234' }, meta)
    await expect(verifyRegisterOtp(mobile, '000000', meta)).rejects.toThrow()
    const record = await prisma.otpCode.findFirst({
      where: { mobile },
      orderBy: { createdAt: 'desc' },
    })
    expect(record!.attempts).toBe(1)
  })

  it('OTP منقضی‌شده رد می‌شود', async () => {
    const mobile = uniqueMobile()
    await register({ mobile, password: 'Test@1234' }, meta)
    await prisma.otpCode.updateMany({
      where: { mobile },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })
    const code = await readDevOtp(mobile)
    await expect(verifyRegisterOtp(mobile, code, meta)).rejects.toThrow(/منقضی/)
  })

  it('Brute Force — پس از ۵ تلاش ناموفق حساب قفل می‌شود', async () => {
    const mobile = uniqueMobile()
    await registerAndVerify(mobile)

    for (let i = 0; i < 5; i++) {
      await expect(login({ mobile, password: 'WrongPass!' }, meta)).rejects.toThrow()
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { mobile } })
    expect(user.lockedUntil).not.toBeNull()

    // حتی با رمز درست هم ورود ممکن نیست
    await expect(login({ mobile, password: 'Test@1234' }, meta)).rejects.toThrow(/قفل/)
  })

  it('Refresh Rotation — token قدیمی reuse شود همه Sessionها لغو می‌شوند', async () => {
    const mobile = uniqueMobile()
    await registerAndVerify(mobile)
    const auth = await login({ mobile, password: 'Test@1234' }, meta)

    // rotation موفق — token جدید می‌گیریم
    const rotated = await rotateSession(auth.refreshToken, meta)
    expect(rotated.refreshToken).toBeTruthy()

    // استفاده مجدد از token قدیمی → reuse detection → همه Sessionها revoke
    await expect(rotateSession(auth.refreshToken, meta)).rejects.toThrow()
    expect((await listSessions(auth.user.id)).length).toBe(0)
  })

  it('User-to-User Isolation — Session کاربر دیگر قابل revoke نیست', async () => {
    const mobileA = uniqueMobile()
    const mobileB = uniqueMobile()
    await registerAndVerify(mobileA)
    await registerAndVerify(mobileB)

    const authB = await login({ mobile: mobileB, password: 'Test@1234' }, meta)
    const payloadB = await verifyRefreshToken(authB.refreshToken)

    const userA = await prisma.user.findUniqueOrThrow({ where: { mobile: mobileA } })
    await expect(revokeUserSession(userA.id, payloadB.sid, meta)).rejects.toThrow()

    // Session کاربر B هنوز فعال است
    expect((await listSessions(userA.id)).length).toBe(0)
    expect((await listSessions(authB.user.id)).length).toBe(1)
  })

  it('Password Reset — پس از reset همه Sessionها revoke می‌شوند', async () => {
    const mobile = uniqueMobile()
    await registerAndVerify(mobile)
    await login({ mobile, password: 'Test@1234' }, meta)
    const user = await prisma.user.findUniqueOrThrow({ where: { mobile } })

    await requestPasswordReset(mobile)
    const code = await readDevOtp(mobile)
    await resetPassword({ mobile, code, password: 'NewPass@99' }, meta)

    // Sessionها لغو شدند
    expect((await listSessions(user.id)).length).toBe(0)

    // ورود با رمز جدید کار می‌کند، با قدیمی نه
    await expect(login({ mobile, password: 'Test@1234' }, meta)).rejects.toThrow()
    const auth = await login({ mobile, password: 'NewPass@99' }, meta)
    expect(auth.accessToken).toBeTruthy()
  })

  it('Duplicate Register — موبایل تکراری conflict می‌دهد', async () => {
    const mobile = uniqueMobile()
    await registerAndVerify(mobile)
    await expect(register({ mobile, password: 'Test@1234' }, meta)).rejects.toThrow()
  })
})
