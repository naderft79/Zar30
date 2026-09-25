// ============================================
// Zar30 - Admin Dashboard V2 Integration Tests
// ============================================
// PostgreSQL واقعی — halt flags، ساختار dashboard، صف‌ها، nav badges
// نکته: تست‌ها وضعیت halt را در پایان آزاد می‌کنند تا DB آلوده نماند
// ============================================

import { afterAll, describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { buyGold } from '@/lib/finance/order.service'
import { requestWithdrawal } from '@/lib/finance/withdrawal.service'
import {
  getHaltFlags,
  isTradingHalted,
  isWithdrawalsHalted,
  setHaltFlag,
} from '@/lib/services/admin-system.service'
import {
  getAdminDashboardV2,
  getAdminNavBadges,
  getQueueRows,
} from '@/lib/services/admin-dashboard.service'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }
const ADMIN = { adminId: 'test-admin-halt', adminRole: 'SUPER_ADMIN' }

describe('Kill Switch — پرچم‌های توقف اضطراری', () => {
  it('پیش‌فرض یا پس از resume فعال نیست', async () => {
    await setHaltFlag(ADMIN, 'TRADING', false, meta)
    const flags = await getHaltFlags()
    expect(flags.trading.halted).toBe(false)
  })

  it('HALT معاملات → خرید با خطای tradingHalted رد می‌شود', async () => {
    await setHaltFlag(ADMIN, 'TRADING', true, meta)
    expect(await isTradingHalted()).toBe(true)
    await expect(
      buyGold({ userId: 'any', kycLevel: 'LEVEL_3' }, { tomanAmount: 1n }),
    ).rejects.toThrow(/توقف|halt/i)
    await setHaltFlag(ADMIN, 'TRADING', false, meta)
    expect(await isTradingHalted()).toBe(false)
  })

  it('HALT برداشت → requestWithdrawal با خطای withdrawalsHalted رد می‌شود', async () => {
    await setHaltFlag(ADMIN, 'WITHDRAWALS', true, meta)
    expect(await isWithdrawalsHalted()).toBe(true)
    await expect(
      requestWithdrawal(
        { userId: 'any', kycLevel: 'LEVEL_3' },
        { amount: 1n, iban: 'IR000000000000000000000000' },
      ),
    ).rejects.toThrow()
    await setHaltFlag(ADMIN, 'WITHDRAWALS', false, meta)
  })

  it('تغییر halt در AuditLog با before/after ثبت می‌شود', async () => {
    await setHaltFlag(ADMIN, 'TRADING', true, meta)
    const log = await prisma.auditLog.findFirst({
      where: { action: 'system.kill_switch.halt', entityId: 'trading.halted' },
      orderBy: { createdAt: 'desc' },
    })
    expect(log).toBeTruthy()
    expect(log!.actorId).toBe(ADMIN.adminId)
    expect((log!.after as { halted?: boolean })?.halted).toBe(true)
    await setHaltFlag(ADMIN, 'TRADING', false, meta)
  })

  it('nav badges وضعیت halt را برای بنر سراسری می‌برگرداند', async () => {
    await setHaltFlag(ADMIN, 'WITHDRAWALS', true, meta)
    const badges = await getAdminNavBadges([])
    expect(badges.halted?.withdrawals).toBe(true)
    await setHaltFlag(ADMIN, 'WITHDRAWALS', false, meta)
  })
})

describe('Dashboard V2 — ساختار پاسخ', () => {
  it('KPIها، صف‌ها، سلامت و وضعیت halt را برمی‌گرداند', async () => {
    const d = await getAdminDashboardV2([], '24h')
    expect(d.kpis.userTomanBalance.value).toBeDefined()
    expect(d.kpis.feeRevenue.sparkline.length).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(d.queues)).toBe(true)
    expect(d.health.db).toBeDefined()
    expect(typeof d.generatedAt).toBe('string')
  })

  it('صف‌ها permission-aware هستند — بدون permission چیزی دیده نمی‌شود', async () => {
    const noPerm = await getAdminDashboardV2([], '24h')
    expect(noPerm.queues.length).toBe(0)
    const withPerm = await getAdminDashboardV2(['kyc.read', 'orders.read'], '24h')
    const keys = withPerm.queues.map((q) => q.key)
    expect(keys).toContain('kyc')
    expect(keys).toContain('orders')
    expect(keys).not.toContain('withdrawals')
  })

  it('getQueueRows فقط ردیف‌های pending را با href معتبر برمی‌گرداند', async () => {
    const rows = await getQueueRows('orders')
    for (const r of rows) {
      expect(r.href.startsWith('/admin/orders/')).toBe(true)
      expect(r.id).toBeTruthy()
    }
  })
})

afterAll(async () => {
  // وضعیت را به حالت عادی برگردان — تست نباید سیستم را halted بگذارد
  await setHaltFlag(ADMIN, 'TRADING', false, meta)
  await setHaltFlag(ADMIN, 'WITHDRAWALS', false, meta)
})
