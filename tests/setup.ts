// ============================================
// Zarnama - Vitest Setup
// ============================================
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// پاکسازی بعد از هر تست
afterEach(() => {
  cleanup()
})
