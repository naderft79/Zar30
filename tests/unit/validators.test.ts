// ============================================
// Zarnama - Validators Test
// ============================================
import { describe, it, expect } from 'vitest'
import { iranMobileSchema, passwordSchema, nationalCodeSchema } from '@/lib/validators/common'

describe('Validators', () => {
  it('should validate Iranian mobile numbers', () => {
    expect(() => iranMobileSchema.parse('09123456789')).not.toThrow()
    expect(() => iranMobileSchema.parse('1234567890')).toThrow()
    expect(() => iranMobileSchema.parse('091234567')).toThrow()
  })

  it('should validate passwords', () => {
    expect(() => passwordSchema.parse('Test@123')).not.toThrow()
    expect(() => passwordSchema.parse('12345678')).toThrow()
    expect(() => passwordSchema.parse('abcdefg')).toThrow()
  })

  it('should validate national codes', () => {
    expect(() => nationalCodeSchema.parse('1234567890')).not.toThrow()
    expect(() => nationalCodeSchema.parse('123')).toThrow()
  })
})
