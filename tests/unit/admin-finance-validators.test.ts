// ============================================
// Zar30 - Admin Finance Validators Unit Tests
// ============================================

import { describe, expect, it } from 'vitest'
import {
  adminAccountListQuerySchema,
  adminOrderListQuerySchema,
  adminPricingListQuerySchema,
  adminTransactionListQuerySchema,
  adminWithdrawalListQuerySchema,
} from '@/lib/validators/admin-finance'
import { isValidAdminDateInput, parseAdminDateBoundary } from '@/lib/utils/admin-time'

describe('admin finance validators', () => {
  it('pagination defaults و coerce', () => {
    const v = adminAccountListQuerySchema.parse({})
    expect(v.page).toBe(1)
    expect(v.limit).toBe(20)
    expect(v.direction).toBe('desc')
    expect(adminAccountListQuerySchema.parse({ page: '3', limit: '50' }).limit).toBe(50)
  })

  it('assetType enum — مقدار نامعتبر رد می‌شود', () => {
    expect(adminAccountListQuerySchema.safeParse({ assetType: 'FIAT' }).success).toBe(false)
    expect(adminAccountListQuerySchema.safeParse({ assetType: 'GOLD' }).success).toBe(true)
  })

  it('date range — from بعد از to رد می‌شود', () => {
    const bad = adminOrderListQuerySchema.safeParse({
      from: '2025-02-01T00:00:00Z',
      to: '2025-01-01T00:00:00Z',
    })
    expect(bad.success).toBe(false)
    const good = adminOrderListQuerySchema.safeParse({
      from: '2025-01-01T00:00:00Z',
      to: '2025-02-01T00:00:00Z',
    })
    expect(good.success).toBe(true)
  })

  it('تاریخ غیر-ISO رد می‌شود', () => {
    expect(adminWithdrawalListQuerySchema.safeParse({ from: 'dirooz' }).success).toBe(false)
  })

  it('date-only YYYY-MM-DD معتبر است؛ همان روز از==تا مجاز', () => {
    const sameDay = adminOrderListQuerySchema.safeParse({
      from: '2026-03-01',
      to: '2026-03-01',
    })
    expect(sameDay.success).toBe(true)
    // ISO datetime قبلی همچنان معتبر
    expect(adminOrderListQuerySchema.safeParse({ from: '2026-03-01T10:30:00Z' }).success).toBe(true)
  })

  it('date-only نامعتبر calendar رد می‌شود', () => {
    expect(isValidAdminDateInput('2026-02-31')).toBe(false)
    expect(isValidAdminDateInput('2026-13-01')).toBe(false)
    expect(adminOrderListQuerySchema.safeParse({ from: '2026-02-31' }).success).toBe(false)
  })

  it('parseAdminDateBoundary — date-only به ابتدا/انتهای روز UTC', () => {
    expect(parseAdminDateBoundary('2026-03-01', false).toISOString()).toBe(
      '2026-03-01T00:00:00.000Z',
    )
    expect(parseAdminDateBoundary('2026-03-01', true).toISOString()).toBe(
      '2026-03-01T23:59:59.999Z',
    )
    // ISO datetime دست‌نخورده
    expect(parseAdminDateBoundary('2026-03-01T10:30:00Z', false).toISOString()).toBe(
      '2026-03-01T10:30:00.000Z',
    )
  })

  it('limit بالای ۱۰۰ رد می‌شود', () => {
    expect(adminTransactionListQuerySchema.safeParse({ limit: '500' }).success).toBe(false)
  })

  it('pricing source max64', () => {
    expect(adminPricingListQuerySchema.safeParse({ source: 'x'.repeat(65) }).success).toBe(false)
    expect(adminPricingListQuerySchema.safeParse({ source: 'tgju' }).success).toBe(true)
  })
})
