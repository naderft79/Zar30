// ============================================
// Zar30 - Admin Validators Unit Tests
// ============================================

import { describe, expect, it } from 'vitest'
import {
  adminKycListQuerySchema,
  adminPaginationSchema,
  adminUserListQuerySchema,
  adminUserStatusSchema,
} from '@/lib/validators/admin'

describe('adminPaginationSchema', () => {
  it('پیش‌فرض‌ها و coerce رشته‌ای', () => {
    expect(adminPaginationSchema.parse({})).toEqual({ page: 1, limit: 20 })
    expect(adminPaginationSchema.parse({ page: '3', limit: '50' })).toEqual({
      page: 3,
      limit: 50,
    })
  })

  it('مقادیر نامعتبر رد می‌شوند', () => {
    expect(adminPaginationSchema.safeParse({ page: 0 }).success).toBe(false)
    expect(adminPaginationSchema.safeParse({ limit: 101 }).success).toBe(false)
    expect(adminPaginationSchema.safeParse({ limit: 'abc' }).success).toBe(false)
  })
})

describe('adminUserListQuerySchema', () => {
  it('defaults و فیلترهای معتبر', () => {
    const parsed = adminUserListQuerySchema.parse({
      q: '  0912  ',
      status: 'BLOCKED',
      kycLevel: 'LEVEL_2',
      sortBy: 'lastLoginAt',
      direction: 'asc',
    })
    expect(parsed.q).toBe('0912')
    expect(parsed.status).toBe('BLOCKED')
    expect(parsed.sortBy).toBe('lastLoginAt')
    expect(parsed.direction).toBe('asc')
  })

  it('sortBy خارج از whitelist رد می‌شود', () => {
    expect(adminUserListQuerySchema.safeParse({ sortBy: 'passwordHash' }).success).toBe(false)
    expect(adminUserListQuerySchema.safeParse({ status: 'BANNED' }).success).toBe(false)
    expect(adminUserListQuerySchema.safeParse({ direction: 'up' }).success).toBe(false)
  })
})

describe('adminUserStatusSchema', () => {
  it('reason الزامی با حداقل ۵ نویسه', () => {
    expect(adminUserStatusSchema.safeParse({ status: 'BLOCKED', reason: 'کم' }).success).toBe(false)
    expect(
      adminUserStatusSchema.safeParse({ status: 'BLOCKED', reason: 'دلیل کافی برای مسدودسازی' })
        .success,
    ).toBe(true)
    // DELETED از این API مجاز نیست
    expect(
      adminUserStatusSchema.safeParse({ status: 'DELETED', reason: 'دلیل کافی' }).success,
    ).toBe(false)
  })
})

describe('adminKycListQuerySchema', () => {
  it('فیلتر status و sort whitelist', () => {
    const parsed = adminKycListQuerySchema.parse({ status: 'SUBMITTED', sortBy: 'submittedAt' })
    expect(parsed.status).toBe('SUBMITTED')
    expect(adminKycListQuerySchema.safeParse({ status: 'EXPIRED' }).success).toBe(false)
    expect(adminKycListQuerySchema.safeParse({ sortBy: 'nationalCode' }).success).toBe(false)
  })
})
