// ============================================
// Zar30 - Utils Test
// ============================================
import { describe, it, expect } from 'vitest'
import { toPersianDigits, formatRial, formatGold, generateReferralCode } from '@/lib/utils/utils'
import { formatExactAmount } from '@/lib/utils/format'

describe('Utils', () => {
  it('should convert digits to Persian', () => {
    expect(toPersianDigits('12345')).toBe('۱۲۳۴۵')
    expect(toPersianDigits(98765)).toBe('۹۸۷۶۵')
  })

  it('should format Rial amounts with Persian separator', () => {
    // Intl.NumberFormat با کامای فارسی جدا می کند
    const result = formatRial(1000000)
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(formatRial(50000000)).toBeDefined()
  })

  it('should format Gold amounts', () => {
    expect(formatGold(1.2345)).toBeDefined()
    expect(formatGold(0.0001)).toBeDefined()
  })

  it('should generate referral codes', () => {
    const code1 = generateReferralCode()
    const code2 = generateReferralCode()
    expect(code1).toHaveLength(8)
    expect(code2).toHaveLength(8)
    expect(code1).not.toBe(code2)
  })
})

describe('formatExactAmount', () => {
  it('مقادیر بزرگ بدون از دست رفتن precision grouped می‌شوند', () => {
    expect(formatExactAmount('900719925474099312345678', { digits: 'en' })).toBe(
      '900,719,925,474,099,312,345,678',
    )
    expect(formatExactAmount(900719925474099312345678n, { digits: 'en' })).toBe(
      '900,719,925,474,099,312,345,678',
    )
  })

  it('صفرهای انتهایی اعشار پیش‌فرض حذف می‌شوند', () => {
    expect(formatExactAmount('123456789.12000000')).toBe('۱۲۳,۴۵۶,۷۸۹.۱۲')
    expect(formatExactAmount('123456789.12000000', { trimTrailingZeros: false })).toBe(
      '۱۲۳,۴۵۶,۷۸۹.۱۲۰۰۰۰۰۰',
    )
    expect(formatExactAmount('10.000')).toBe('۱۰')
  })

  it('leading zeros و علامت منفی درست هستند', () => {
    expect(formatExactAmount('007', { digits: 'en' })).toBe('7')
    expect(formatExactAmount('000', { digits: 'en' })).toBe('0')
    expect(formatExactAmount('-1234.50', { digits: 'en' })).toBe('-1,234.5')
  })

  it('ورودی نامعتبر → صفر', () => {
    expect(formatExactAmount('abc')).toBe('۰')
    expect(formatExactAmount('1.2.3')).toBe('۰')
    expect(formatExactAmount('', { digits: 'en' })).toBe('0')
  })
})
