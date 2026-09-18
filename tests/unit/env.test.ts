// ============================================
// Zarnama - Environment Validation Test
// ============================================
import { describe, it, expect } from 'vitest'

describe('Environment Validation', () => {
  it('should have required env vars defined', () => {
    expect(process.env.DATABASE_URL).toBeDefined()
    expect(process.env.REDIS_URL).toBeDefined()
  })
})
