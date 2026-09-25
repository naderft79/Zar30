// ============================================
// Zar30 - Admin Dashboard V2 Validator Tests
// ============================================

import { describe, expect, it } from 'vitest'
import {
  dashboardChartsQuerySchema,
  dashboardLayoutSchema,
  dashboardNoteSchema,
  dashboardPeriodSchema,
  dashboardQueueKeySchema,
  killSwitchSchema,
  KILL_SWITCH_CONFIRM,
} from '@/lib/validators/admin-dashboard'

describe('dashboardPeriodSchema', () => {
  it('پیش‌فرض ۲۴ ساعت است', () => {
    expect(dashboardPeriodSchema.parse({}).period).toBe('24h')
  })

  it.each(['24h', '7d', '30d'])('بازه معتبر %s', (p) => {
    expect(dashboardPeriodSchema.parse({ period: p }).period).toBe(p)
  })

  it('بازه نامعتبر رد می‌شود', () => {
    expect(dashboardPeriodSchema.safeParse({ period: '90d' }).success).toBe(false)
  })
})

describe('dashboardChartsQuerySchema', () => {
  it('پیش‌فرض ۳۰ روز است', () => {
    expect(dashboardChartsQuerySchema.parse({}).range).toBe(30)
  })

  it.each([7, 30, 90])('بازه %s روز معتبر است', (r) => {
    expect(dashboardChartsQuerySchema.parse({ range: r }).range).toBe(r)
  })

  it('بازه خارج از ۷/۳۰/۹۰ رد می‌شود', () => {
    expect(dashboardChartsQuerySchema.safeParse({ range: 14 }).success).toBe(false)
    expect(dashboardChartsQuerySchema.safeParse({ range: 0 }).success).toBe(false)
  })

  it('رشته عددی coerce می‌شود', () => {
    expect(dashboardChartsQuerySchema.parse({ range: '90' }).range).toBe(90)
  })
})

describe('dashboardQueueKeySchema', () => {
  it.each(['kyc', 'withdrawals', 'orders', 'tickets', 'delivery', 'risk'])(
    'کلید %s معتبر است',
    (k) => {
      expect(dashboardQueueKeySchema.safeParse(k).success).toBe(true)
    },
  )

  it('کلید ناشناخته رد می‌شود', () => {
    expect(dashboardQueueKeySchema.safeParse('wallets').success).toBe(false)
  })
})

describe('dashboardLayoutSchema', () => {
  it('لیست ویجت‌های مخفی معتبر است', () => {
    const v = dashboardLayoutSchema.parse({ hiddenWidgets: ['charts', 'feeds'] })
    expect(v.hiddenWidgets).toEqual(['charts', 'feeds'])
  })

  it('بیش از ۴۰ ویجت رد می‌شود', () => {
    const hidden = Array.from({ length: 41 }, (_, i) => `w${i}`)
    expect(dashboardLayoutSchema.safeParse({ hiddenWidgets: hidden }).success).toBe(false)
  })
})

describe('dashboardNoteSchema', () => {
  it('متن معتبر + pinned پیش‌فرض false', () => {
    const v = dashboardNoteSchema.parse({ text: 'یادداشت تیمی' })
    expect(v.pinned).toBe(false)
  })

  it('متن خالی یا بلند رد می‌شود', () => {
    expect(dashboardNoteSchema.safeParse({ text: '' }).success).toBe(false)
    expect(dashboardNoteSchema.safeParse({ text: 'الف'.repeat(501) }).success).toBe(false)
  })
})

describe('killSwitchSchema', () => {
  it('scope/action معتبر + confirm الزامی', () => {
    const v = killSwitchSchema.parse({
      scope: 'TRADING',
      action: 'HALT',
      confirm: KILL_SWITCH_CONFIRM.TRADING.halt,
    })
    expect(v.scope).toBe('TRADING')
  })

  it('بدون confirm رد می‌شود', () => {
    expect(killSwitchSchema.safeParse({ scope: 'WITHDRAWALS', action: 'RESUME' }).success).toBe(
      false,
    )
  })

  it('عبارت تأیید برای هر scope/action تعریف شده است', () => {
    expect(KILL_SWITCH_CONFIRM.TRADING.halt).not.toBe(KILL_SWITCH_CONFIRM.TRADING.resume)
    expect(KILL_SWITCH_CONFIRM.WITHDRAWALS.halt).toBeTruthy()
    expect(KILL_SWITCH_CONFIRM.WITHDRAWALS.resume).toBeTruthy()
  })
})
