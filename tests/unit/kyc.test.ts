// ============================================
// Zar30 - KYC Unit Tests (Phase 4)
// ============================================
// Validators + AES-GCM + تبدیل تاریخ جلالی — بدون DB
// ============================================

import { describe, it, expect } from 'vitest'
import {
  isValidNationalCode,
  isValidIban,
  isValidCardNumber,
  isValidBirthDate,
  kycDraftSchema,
} from '@/lib/validators/kyc'
import {
  encryptString,
  decryptString,
  encryptBuffer,
  decryptBuffer,
  sha256Hex,
} from '@/lib/crypto/aes-gcm'
import {
  jalaliToGregorian,
  gregorianToJalali,
  jalaliMonthLength,
  isJalaliLeap,
} from '@/lib/utils/jalali'

describe('KYC Validators', () => {
  it('کد ملی — checksum واقعی', () => {
    expect(isValidNationalCode('0499370899')).toBe(true)
    expect(isValidNationalCode('0084575948')).toBe(true)
    // checksum غلط
    expect(isValidNationalCode('0499370898')).toBe(false)
    // همه رقم یکسان
    expect(isValidNationalCode('1111111111')).toBe(false)
    // طول/فرمت
    expect(isValidNationalCode('123')).toBe(false)
    expect(isValidNationalCode('049937089a')).toBe(false)
  })

  it('شبا — mod-97 IBAN', () => {
    expect(isValidIban('IR110170000000101234567890')).toBe(true)
    expect(isValidIban('ir110170000000101234567890')).toBe(true) // case-insensitive
    expect(isValidIban('IR120170000000101234567890')).toBe(false) // check digit غلط
    expect(isValidIban('IR11017000000010123456789')).toBe(false) // کوتاه
    expect(isValidIban('FR110170000000101234567890')).toBe(false) // کشور دیگر
  })

  it('کارت بانکی — ۱۶ رقم', () => {
    expect(isValidCardNumber('6037991122334455')).toBe(true)
    expect(isValidCardNumber('603799112233445')).toBe(false)
    expect(isValidCardNumber('60379911223344551')).toBe(false)
  })

  it('تاریخ تولد — ۱۸ تا ۱۲۰ سال', () => {
    const now = new Date()
    expect(isValidBirthDate(new Date(now.getFullYear() - 25, 0, 1))).toBe(true)
    expect(isValidBirthDate(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()))).toBe(
      true,
    )
    expect(isValidBirthDate(new Date(now.getFullYear() - 10, 0, 1))).toBe(false)
    expect(isValidBirthDate(new Date(now.getFullYear() + 1, 0, 1))).toBe(false)
    expect(isValidBirthDate(new Date(now.getFullYear() - 130, 0, 1))).toBe(false)
  })

  it('draft schema — فیلدهای نامعتبر رد می‌شوند', () => {
    expect(kycDraftSchema.safeParse({ nationalCode: '0499370899' }).success).toBe(true)
    expect(kycDraftSchema.safeParse({ nationalCode: '1111111111' }).success).toBe(false)
    expect(kycDraftSchema.safeParse({ currentStep: 3 }).success).toBe(true)
    expect(kycDraftSchema.safeParse({ currentStep: 99 }).success).toBe(false)
  })
})

describe('AES-256-GCM', () => {
  it('رشته — رمزنگاری و رمزگشایی roundtrip', () => {
    const secret = 'IR110170000000101234567890'
    const enc = encryptString(secret)
    expect(enc).not.toContain(secret)
    expect(enc.startsWith('v1:')).toBe(true)
    expect(decryptString(enc)).toBe(secret)
  })

  it('buffer — فایل roundtrip + tamper detection', () => {
    const file = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
    const enc = encryptBuffer(file)
    expect(decryptBuffer(enc)).toEqual(file)
    // دستکاری ciphertext → GCM auth tag شکست می‌خورد
    enc[30] = enc[30]! ^ 0xff
    expect(() => decryptBuffer(enc)).toThrow()
  })

  it('sha256 — هش پایدار', () => {
    const h = sha256Hex(Buffer.from('zar30'))
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(sha256Hex(Buffer.from('zar30'))).toBe(h)
  })
})

describe('Jalali Date', () => {
  it('تبدیل جلالی → میلادی', () => {
    const g = jalaliToGregorian(1403, 1, 1) // نوروز ۱۴۰۳ = ۲۰ مارس ۲۰۲۴
    expect(g).not.toBeNull()
    expect(g!.getUTCFullYear()).toBe(2024)
    expect(g!.getUTCMonth()).toBe(2)
    expect(g!.getUTCDate()).toBe(20)
  })

  it('میلادی → جلالی roundtrip', () => {
    const j = gregorianToJalali(new Date(Date.UTC(1990, 5, 15)))
    const back = jalaliToGregorian(j.jy, j.jm, j.jd)
    expect(back!.getTime()).toBe(Date.UTC(1990, 5, 15))
  })

  it('اسفند کبیسه ۳۰ روز', () => {
    expect(isJalaliLeap(1403)).toBe(true)
    expect(jalaliMonthLength(1403, 12)).toBe(30)
    expect(jalaliMonthLength(1404, 12)).toBe(29)
    expect(jalaliToGregorian(1404, 12, 30)).toBeNull() // اسفند ۱۴۰۴ سی روز ندارد
  })

  it('تاریخ نامعتبر null می‌دهد', () => {
    expect(jalaliToGregorian(1403, 13, 1)).toBeNull()
    expect(jalaliToGregorian(1403, 7, 31)).toBeNull() // مهر ۳۱ روز ندارد
    expect(jalaliToGregorian(0, 1, 1)).toBeNull()
  })
})
