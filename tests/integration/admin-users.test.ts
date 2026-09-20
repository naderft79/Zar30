// ============================================
// Zar30 - Admin Users Integration Tests
// ============================================
// list pagination/filter + detail permission-scoped + status mutation اتمیک
// PostgreSQL واقعی
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'
import {
  changeAdminUserStatus,
  getAdminUserDetail,
  listAdminUsers,
} from '@/lib/services/admin-user.service'
import { resolvePermissions } from '@/lib/auth/rbac'
import type { AdminContext } from '@/lib/auth/guard'

const meta = { ip: '127.0.0.1', userAgent: 'vitest', requestId: 'req-test-1' }

function uniqueMobile() {
  return `0913${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function createVerifiedUser() {
  const mobile = uniqueMobile()
  await register({ mobile, password: 'Test@1234' }, meta)
  const code = await redis.get(`devotp:${mobile}`)
  await verifyRegisterOtp(mobile, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

type AdminRole = 'SUPER_ADMIN' | 'FINANCE' | 'SUPPORT' | 'KYC' | 'RISK' | 'READ_ONLY'

async function createAdmin(role: AdminRole, permissions: object = {}) {
  const user = await createVerifiedUser()
  const admin = await prisma.adminUser.create({
    data: { userId: user.id, role, permissions },
  })
  const ctx: AdminContext = {
    userId: user.id,
    mobile: user.mobile,
    kycLevel: user.kycLevel,
    adminId: admin.id,
    adminRole: admin.role,
    permissions: resolvePermissions(admin.role, admin.permissions),
  }
  return { admin, ctx }
}

describe('Admin Users Service (DB واقعی)', () => {
  it('list — pagination و فیلتر status/q', async () => {
    const user = await createVerifiedUser()
    await prisma.user.update({ where: { id: user.id }, data: { firstName: 'جستجوگرمنحصربفرد' } })

    const page1 = await listAdminUsers({
      page: 1,
      limit: 5,
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(page1.rows.length).toBeLessThanOrEqual(5)
    expect(page1.total).toBeGreaterThanOrEqual(1)
    // صفحه ۲ معتبر است حتی اگر خالی باشد
    const page2 = await listAdminUsers({
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(page2.total).toBe(page1.total)

    // جستجوی نام — insensitive
    const found = await listAdminUsers({
      page: 1,
      limit: 20,
      q: 'جستجوگرمنحصربفرد',
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(found.rows.some((r) => r.id === user.id)).toBe(true)

    // فیلتر status — کاربر جدید ACTIVE است؛ DELETED نباید او را بگیرد
    const blocked = await listAdminUsers({
      page: 1,
      limit: 100,
      status: 'DELETED',
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(blocked.rows.some((r) => r.id === user.id)).toBe(false)

    // ردیف‌ها riskState:null و مقادیر مالی string دارند
    const row = found.rows.find((r) => r.id === user.id)!
    expect(row.riskState).toBeNull()
    expect(typeof row.rialBalance).toBe('string')
    expect(typeof row.goldBalance).toBe('string')

    // nulls-last — sort روی lastLoginAt؛ هیچ کاربرِ login‌نکرده‌ای قبل از login‌کرده نمی‌آید
    const sorted = await listAdminUsers({
      page: 1,
      limit: 100,
      sortBy: 'lastLoginAt',
      direction: 'asc',
    })
    const firstNullIndex = sorted.rows.findIndex((r) => r.lastLoginAt === null)
    if (firstNullIndex !== -1) {
      expect(sorted.rows.slice(firstNullIndex).every((r) => r.lastLoginAt === null)).toBe(true)
    }
  })

  it('detail — permission-scoped: SUPPORT فقط base+kyc؛ FINANCE بدون kyc با wallet/transactions', async () => {
    const target = await createVerifiedUser()
    const support = await createAdmin('SUPPORT')
    const finance = await createAdmin('FINANCE')

    const supportView = await getAdminUserDetail(target.id, support.ctx.permissions)
    expect(supportView.user.id).toBe(target.id)
    expect(supportView.kyc).not.toBeNull() // SUPPORT دارد kyc.read
    expect(supportView.wallet).toBeNull() // accounts/wallets.read ندارد
    expect(supportView.transactions).toBeNull()
    expect(supportView.orders).toBeNull()
    expect(supportView.sessions).toBeNull()
    expect(supportView.audit).toBeNull()

    const financeView = await getAdminUserDetail(target.id, finance.ctx.permissions)
    expect(financeView.kyc).toBeNull() // FINANCE ندارد kyc.read
    expect(financeView.wallet).not.toBeNull()
    expect(financeView.transactions).not.toBeNull()
    expect(financeView.orders).not.toBeNull()
    expect(financeView.sessions).toBeNull()
    expect(financeView.audit).toBeNull()

    // adminRole فقط role+active
    const { admin: targetAdmin } = await createAdmin('READ_ONLY')
    const detail = await getAdminUserDetail(targetAdmin.userId, finance.ctx.permissions)
    expect(detail.adminRole).toEqual({ role: 'READ_ONLY', active: true })
    expect(JSON.stringify(detail.adminRole)).not.toContain('permissions')
  })

  it('status BLOCKED — اتمیک: revoke sessions + notification + strict audit metadata', async () => {
    const target = await createVerifiedUser()
    // نشست فعال واقعی برای بررسی revoke — verifyRegisterOtp نشست نمی‌سازد
    await prisma.session.create({
      data: {
        userId: target.id,
        refreshTokenHash: `test-${target.id}`,
        expiresAt: new Date(Date.now() + 86400_000),
      },
    })
    const { ctx } = await createAdmin('SUPER_ADMIN')

    const sessionsBefore = await prisma.session.count({
      where: { userId: target.id, revokedAt: null },
    })
    expect(sessionsBefore).toBeGreaterThan(0)

    const result = await changeAdminUserStatus(
      ctx,
      target.id,
      { status: 'BLOCKED', reason: 'فعالیت مشکوک تایید شد' },
      meta,
    )
    expect(result.status).toBe('BLOCKED')

    // همه نشست‌های فعال revoke شدند
    const activeSessions = await prisma.session.count({
      where: { userId: target.id, revokedAt: null, expiresAt: { gt: new Date() } },
    })
    expect(activeSessions).toBe(0)

    // اعلان واقعی
    const notif = await prisma.notification.findFirst({
      where: { userId: target.id, type: 'account_blocked' },
    })
    expect(notif).toBeTruthy()

    // audit strict با metadata کامل
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'USER_BLOCKED', targetUserId: target.id },
    })
    expect(audit).toBeTruthy()
    expect(audit!.actorRole).toBe('SUPER_ADMIN')
    expect(audit!.reason).toBe('فعالیت مشکوک تایید شد')
    expect(audit!.requestId).toBe('req-test-1')

    // idempotent — دوباره BLOCKED بدون audit جدید
    const auditCount = await prisma.auditLog.count({
      where: { action: 'USER_BLOCKED', targetUserId: target.id },
    })
    await changeAdminUserStatus(ctx, target.id, { status: 'BLOCKED', reason: 'تکرار' }, meta)
    const auditCountAfter = await prisma.auditLog.count({
      where: { action: 'USER_BLOCKED', targetUserId: target.id },
    })
    expect(auditCountAfter).toBe(auditCount)
  })

  it('self-block ممنوع است', async () => {
    const { ctx } = await createAdmin('SUPER_ADMIN')
    await expect(
      changeAdminUserStatus(ctx, ctx.userId, { status: 'BLOCKED', reason: 'دلیل کافی' }, meta),
    ).rejects.toThrow(/خودتان/)
  })

  it('ادمین غیر SUPER نمی‌تواند ادمین فعال را مسدود کند', async () => {
    const { admin: targetAdmin } = await createAdmin('KYC')
    const { ctx: financeCtx } = await createAdmin('FINANCE')
    await expect(
      changeAdminUserStatus(
        financeCtx,
        targetAdmin.userId,
        { status: 'BLOCKED', reason: 'دلیل کافی برای تست' },
        meta,
      ),
    ).rejects.toThrow(/مدیر ارشد/)

    // SUPER_ADMIN می‌تواند
    const { ctx: superCtx } = await createAdmin('SUPER_ADMIN')
    const res = await changeAdminUserStatus(
      superCtx,
      targetAdmin.userId,
      { status: 'BLOCKED', reason: 'دلیل کافی برای تست' },
      meta,
    )
    expect(res.status).toBe('BLOCKED')
  })

  it('target ناموجود → 404', async () => {
    const { ctx } = await createAdmin('SUPER_ADMIN')
    await expect(
      changeAdminUserStatus(
        ctx,
        '00000000-0000-0000-0000-000000000000',
        { status: 'BLOCKED', reason: 'دلیل کافی' },
        meta,
      ),
    ).rejects.toThrow(/یافت نشد/)
  })
})
