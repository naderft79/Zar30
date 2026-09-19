// ============================================
// Zar30 - User Panel Unit Tests (Phase 3)
// ============================================
// Profile validation + User-Agent parsing
// ============================================
import { describe, it, expect } from 'vitest'
import { profileUpdateSchema } from '@/lib/validators/users'
import { parseUserAgent } from '@/lib/utils/user-agent'

describe('profileUpdateSchema', () => {
  it('به‌روزرسانی معتبر نام و ایمیل را قبول می‌کند', () => {
    const out = profileUpdateSchema.parse({
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'ali@example.com',
    })
    expect(out.firstName).toBe('علی')
    expect(out.email).toBe('ali@example.com')
  })

  it('ایمیل نامعتبر رد می‌شود', () => {
    expect(() => profileUpdateSchema.parse({ email: 'not-an-email' })).toThrow()
  })

  it('ایمیل خالی به null تبدیل می‌شود (پاک‌کردن ایمیل)', () => {
    const out = profileUpdateSchema.parse({ email: '' })
    expect(out.email).toBeNull()
  })

  it('نام بیش از ۶۴ کاراکتر رد می‌شود', () => {
    expect(() => profileUpdateSchema.parse({ firstName: 'الف'.repeat(65) })).toThrow()
  })

  it('فیلدهای حساس (mobile/kyc/status) در خروجی schema نیستند', () => {
    const out = profileUpdateSchema.parse({
      firstName: 'تست',
      mobile: '09999999999',
      kycLevel: 'LEVEL_3',
      status: 'BLOCKED',
    } as never)
    expect(out).not.toHaveProperty('mobile')
    expect(out).not.toHaveProperty('kycLevel')
    expect(out).not.toHaveProperty('status')
  })

  it('بدون فیلد هم معتبر است (همه اختیاری)', () => {
    expect(() => profileUpdateSchema.parse({})).not.toThrow()
  })
})

describe('parseUserAgent', () => {
  it('Windows + Chrome را تشخیص می‌دهد', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    const info = parseUserAgent(ua)
    expect(info.os).toBe('Windows')
    expect(info.browser).toBe('Chrome')
    expect(info.device).toBe('desktop')
  })

  it('iPhone + Safari را موبایل تشخیص می‌دهد', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
    const info = parseUserAgent(ua)
    expect(info.os).toBe('iOS')
    expect(info.device).toBe('mobile')
    expect(info.browser).toBe('Safari')
  })

  it('iPad را تبلت تشخیص می‌دهد', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
    const info = parseUserAgent(ua)
    expect(info.os).toBe('iOS')
    expect(info.device).toBe('tablet')
  })

  it('Android + Chrome را موبایل تشخیص می‌دهد', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
    const info = parseUserAgent(ua)
    expect(info.os).toBe('Android')
    expect(info.device).toBe('mobile')
    expect(info.browser).toBe('Chrome')
  })

  it('Edge قبل از Chrome تشخیص داده می‌شود', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0'
    expect(parseUserAgent(ua).browser).toBe('Edge')
  })

  it('UA خالی یا ناشناخته unknown برمی‌گرداند', () => {
    expect(parseUserAgent('').device).toBe('unknown')
    expect(parseUserAgent('garbage').os).toBe('unknown')
  })

  it('curl را تشخیص می‌دهد', () => {
    expect(parseUserAgent('curl/8.0.1').browser).toBe('curl')
  })
})
