// ============================================
// Zar30 - Auth Unit Tests (Phase 2)
// ============================================
// password hashing, JWT, OTP generation, RBAC
// ============================================

import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { generateOtpCode } from '@/lib/auth/otp'
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt'
import { hasPermission, requirePermission, PERMISSIONS } from '@/lib/auth/rbac'

describe('Password Security', () => {
  it('hash رمز عبور قابل verify است', async () => {
    const hash = await hashPassword('MyS3cret!Pass')
    expect(hash).not.toContain('MyS3cret!Pass')
    expect(await verifyPassword('MyS3cret!Pass', hash)).toBe(true)
  })

  it('رمز اشتباه verify نمی‌شود', async () => {
    const hash = await hashPassword('CorrectPass1')
    expect(await verifyPassword('WrongPass1', hash)).toBe(false)
  })

  it('hash یکسان برای یک رمز تکرارپذیر نیست (salt)', async () => {
    const h1 = await hashPassword('SamePass123')
    const h2 = await hashPassword('SamePass123')
    expect(h1).not.toBe(h2)
  })
})

describe('OTP Generation', () => {
  it('کد ۶ رقمی عددی تولید می‌کند', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode()
      expect(code).toMatch(/^\d{6}$/)
    }
  })

  it('کدها تصادفی‌اند', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOtpCode()))
    // احتمال برخورد در ۲۰ نمونه از ۱ میلیون عملاً صفر است
    expect(codes.size).toBeGreaterThan(15)
  })
})

describe('JWT', () => {
  it('access token sign و verify می‌شود', async () => {
    const token = await signAccessToken({
      sub: 'user-1',
      mobile: '09120000000',
      kycLevel: 'LEVEL_1',
      sid: 'sess-1',
    })
    const payload = await verifyAccessToken(token)
    expect(payload.sub).toBe('user-1')
    expect(payload.mobile).toBe('09120000000')
    expect(payload.kycLevel).toBe('LEVEL_1')
    expect(payload.sid).toBe('sess-1')
  })

  it('refresh token با sid sign و verify می‌شود', async () => {
    const token = await signRefreshToken({ sub: 'user-1', sid: 'sess-1', jti: 'j1' })
    const payload = await verifyRefreshToken(token)
    expect(payload.sub).toBe('user-1')
    expect(payload.sid).toBe('sess-1')
  })

  it('access token با secret اشتباه verify نمی‌شود', async () => {
    const token = await signAccessToken({ sub: 'u', mobile: 'm', kycLevel: 'k', sid: 's' })
    await expect(verifyRefreshToken(token)).rejects.toThrow()
  })

  it('token دست‌کاری‌شده verify نمی‌شود', async () => {
    const token = await signAccessToken({ sub: 'u', mobile: 'm', kycLevel: 'k', sid: 's' })
    const tampered = token.slice(0, -4) + 'AAAA'
    await expect(verifyAccessToken(tampered)).rejects.toThrow()
  })
})

describe('RBAC', () => {
  it('SUPER_ADMIN همه permissionها را دارد', () => {
    for (const p of Object.values(PERMISSIONS)) {
      expect(hasPermission('SUPER_ADMIN', p)).toBe(true)
    }
  })

  it('USER هیچ permission ادمینی ندارد', () => {
    expect(hasPermission('USER', PERMISSIONS.USERS_READ)).toBe(false)
    expect(hasPermission('USER', PERMISSIONS.LEDGER_READ)).toBe(false)
  })

  it('SUPPORT فقط ticket/users read دارد', () => {
    expect(hasPermission('SUPPORT', PERMISSIONS.TICKETS_REPLY)).toBe(true)
    expect(hasPermission('SUPPORT', PERMISSIONS.WITHDRAWALS_APPROVE)).toBe(false)
  })

  it('requirePermission برای نقش نامجاز خطا می‌دهد', () => {
    expect(() => requirePermission('USER', PERMISSIONS.SETTINGS_MANAGE)).toThrow()
    expect(() => requirePermission('SUPER_ADMIN', PERMISSIONS.SETTINGS_MANAGE)).not.toThrow()
  })
})
