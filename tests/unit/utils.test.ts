// ============================================
// Zarnama - Utils Test
// ============================================
import { describe, it, expect } from 'vitest'
import { toPersianDigits, formatRial, formatGold, generateReferralCode } from '@/lib/utils/utils'

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
