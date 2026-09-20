// ============================================
// Zar30 - Admin Users Service
// ============================================
// عملیات مشتری در مرکز عملیات — list/detail وضعیت
// Detail permission-scoped: هر بخش فقط با permission متناظر برمی‌گردد
// همه مقادیر مالی string؛ هیچ محاسبه JS روی BigInt/Decimal
// ============================================

import type { AdminRole, KycLevel, Prisma, UserStatus } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import type { AdminContext } from '@/lib/auth/guard'
import type { SessionMeta } from '@/lib/auth/session'
import type { AdminUserListQuery } from '@/lib/validators/admin'

// ---------- Types ----------

export interface AdminUserListRow {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
  email: string | null
  status: UserStatus
  kycLevel: KycLevel
  /** امتیاز اعتباری موجود دامین — risk score نیست */
  creditScore: number
  /** placeholder ساختاری — risk engine هنوز وجود ندارد */
  riskState: null
  lastLoginAt: string | null
  createdAt: string
  rialBalance: string
  rialLockedBalance: string
  goldBalance: string
  goldLockedBalance: string
  counts: { orders: number; transactions: number; tickets: number; sessions: number }
}

export interface AdminUserDetail {
  user: {
    id: string
    mobile: string
    firstName: string | null
    lastName: string | null
    email: string | null
    status: UserStatus
    kycLevel: KycLevel
    creditScore: number
    riskState: null
    referralCode: string
    mobileVerifiedAt: string | null
    lastLoginAt: string | null
    createdAt: string
  }
  counts: {
    orders: number
    transactions: number
    tickets: number
    sessions: number
    kycSubmissions: number
  }
  /** فقط اگر کاربر admin است — role+active؛ custom permissions برنمی‌گردد */
  adminRole: { role: AdminRole; active: boolean } | null
  /** null = permission ندارد */
  kyc:
    | {
        id: string
        level: KycLevel
        status: string
        currentStep: number
        submittedAt: string | null
        reviewedAt: string | null
        rejectionReason: string | null
      }[]
    | null
  wallet: {
    accounts: { assetType: string; balance: string; lockedBalance: string }[]
  } | null
  transactions:
    | {
        id: string
        type: string
        amount: string
        status: string
        journalEntryId: string | null
        createdAt: string
      }[]
    | null
  orders:
    | {
        id: string
        type: string
        goldAmount: string
        rialAmount: string
        unitPrice: string
        spread: string
        fee: string
        total: string
        status: string
        createdAt: string
      }[]
    | null
  sessions:
    | {
        id: string
        deviceInfo: string | null
        ip: string | null
        userAgent: string | null
        expiresAt: string
        revokedAt: string | null
        createdAt: string
      }[]
    | null
  audit:
    | {
        id: string
        action: string
        actorType: string
        actorId: string | null
        actorRole: string | null
        entityType: string
        entityId: string | null
        requestId: string | null
        reason: string | null
        ip: string | null
        createdAt: string
      }[]
    | null
}

// ---------- List ----------

export async function listAdminUsers(
  input: AdminUserListQuery,
): Promise<{ rows: AdminUserListRow[]; total: number }> {
  const where = {
    ...(input.status && { status: input.status }),
    ...(input.kycLevel && { kycLevel: input.kycLevel }),
    ...(input.q && {
      OR: [
        { mobile: { contains: input.q, mode: 'insensitive' as const } },
        { firstName: { contains: input.q, mode: 'insensitive' as const } },
        { lastName: { contains: input.q, mode: 'insensitive' as const } },
        { email: { contains: input.q, mode: 'insensitive' as const } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  // whitelist sort — کاربرانی که هرگز login نکرده‌اند آخر می‌آیند
  const orderBy: Prisma.UserOrderByWithRelationInput =
    input.sortBy === 'lastLoginAt'
      ? { lastLoginAt: { sort: input.direction, nulls: 'last' } }
      : { createdAt: input.direction }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: input.limit,
      select: {
        id: true,
        mobile: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        kycLevel: true,
        creditScore: true,
        lastLoginAt: true,
        createdAt: true,
        wallet: {
          select: {
            assetAccounts: {
              select: { assetType: true, balance: true, lockedBalance: true },
            },
          },
        },
        _count: {
          select: { orders: true, transactions: true, tickets: true, sessions: true },
        },
      },
    }),
  ])

  const rows = users.map((u) => {
    const accounts = u.wallet?.assetAccounts ?? []
    const rial = accounts.find((a) => a.assetType === 'RIAL')
    const gold = accounts.find((a) => a.assetType === 'GOLD')
    return {
      id: u.id,
      mobile: u.mobile,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      status: u.status,
      kycLevel: u.kycLevel,
      creditScore: u.creditScore,
      riskState: null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      rialBalance: (rial?.balance ?? 0).toString(),
      rialLockedBalance: (rial?.lockedBalance ?? 0).toString(),
      goldBalance: (gold?.balance ?? 0).toString(),
      goldLockedBalance: (gold?.lockedBalance ?? 0).toString(),
      counts: {
        orders: u._count.orders,
        transactions: u._count.transactions,
        tickets: u._count.tickets,
        sessions: u._count.sessions,
      },
    }
  })

  return { rows, total }
}

// ---------- Detail (permission-scoped) ----------

export async function getAdminUserDetail(
  userId: string,
  permissions: readonly Permission[],
): Promise<AdminUserDetail> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mobile: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      kycLevel: true,
      creditScore: true,
      referralCode: true,
      mobileVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      adminUser: { select: { role: true, active: true } },
      _count: {
        select: {
          orders: true,
          transactions: true,
          tickets: true,
          sessions: true,
          kycSubmissions: true,
        },
      },
    },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')

  const canKyc = hasPermission(permissions, PERMISSIONS.KYC_READ)
  const canAccounts =
    hasPermission(permissions, PERMISSIONS.ACCOUNTS_READ) ||
    hasPermission(permissions, PERMISSIONS.WALLETS_READ)
  const canTransactions = hasPermission(permissions, PERMISSIONS.TRANSACTIONS_READ)
  const canOrders = hasPermission(permissions, PERMISSIONS.ORDERS_READ)
  const canSecurity = hasPermission(permissions, PERMISSIONS.SECURITY_READ)
  const canAudit = hasPermission(permissions, PERMISSIONS.AUDIT_READ)

  const [kyc, wallet, transactions, orders, sessions, audit] = await Promise.all([
    canKyc
      ? prisma.kycSubmission.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            level: true,
            status: true,
            currentStep: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        })
      : Promise.resolve(null),
    canAccounts
      ? prisma.wallet.findUnique({
          where: { userId },
          select: {
            assetAccounts: {
              select: { assetType: true, balance: true, lockedBalance: true },
            },
          },
        })
      : Promise.resolve(null),
    canTransactions
      ? prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            journalEntryId: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
    canOrders
      ? prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            goldAmount: true,
            rialAmount: true,
            unitPrice: true,
            spread: true,
            fee: true,
            total: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
    canSecurity
      ? prisma.session.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            deviceInfo: true,
            ip: true,
            userAgent: true,
            expiresAt: true,
            revokedAt: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
    canAudit
      ? prisma.auditLog.findMany({
          where: { OR: [{ actorId: userId }, { targetUserId: userId }] },
          orderBy: { createdAt: 'desc' },
          take: 20,
          // metadata فقط — before/after در ماژول audit detail می‌آید
          select: {
            id: true,
            action: true,
            actorType: true,
            actorId: true,
            actorRole: true,
            entityType: true,
            entityId: true,
            requestId: true,
            reason: true,
            ip: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
  ])

  return {
    user: {
      id: user.id,
      mobile: user.mobile,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      kycLevel: user.kycLevel,
      creditScore: user.creditScore,
      riskState: null,
      referralCode: user.referralCode,
      mobileVerifiedAt: user.mobileVerifiedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    counts: {
      orders: user._count.orders,
      transactions: user._count.transactions,
      tickets: user._count.tickets,
      sessions: user._count.sessions,
      kycSubmissions: user._count.kycSubmissions,
    },
    adminRole: user.adminUser ? { role: user.adminUser.role, active: user.adminUser.active } : null,
    kyc:
      kyc?.map((s) => ({
        id: s.id,
        level: s.level,
        status: s.status,
        currentStep: s.currentStep,
        submittedAt: s.submittedAt?.toISOString() ?? null,
        reviewedAt: s.reviewedAt?.toISOString() ?? null,
        rejectionReason: s.rejectionReason,
      })) ?? null,
    // permission دارد ولی wallet هنوز ساخته نشده → شی خالی واقعی، نه null
    wallet: canAccounts
      ? {
          accounts: (wallet?.assetAccounts ?? []).map((a) => ({
            assetType: a.assetType,
            balance: a.balance.toString(),
            lockedBalance: a.lockedBalance.toString(),
          })),
        }
      : null,
    transactions:
      transactions?.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        status: t.status,
        journalEntryId: t.journalEntryId,
        createdAt: t.createdAt.toISOString(),
      })) ?? null,
    orders:
      orders?.map((o) => ({
        id: o.id,
        type: o.type,
        goldAmount: o.goldAmount.toString(),
        rialAmount: o.rialAmount.toString(),
        unitPrice: o.unitPrice.toString(),
        spread: o.spread.toString(),
        fee: o.fee.toString(),
        total: o.total.toString(),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })) ?? null,
    sessions:
      sessions?.map((s) => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        ip: s.ip,
        userAgent: s.userAgent,
        expiresAt: s.expiresAt.toISOString(),
        revokedAt: s.revokedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })) ?? null,
    audit:
      audit?.map((a) => ({
        id: a.id,
        action: a.action,
        actorType: a.actorType,
        actorId: a.actorId,
        actorRole: a.actorRole,
        entityType: a.entityType,
        entityId: a.entityId,
        requestId: a.requestId,
        reason: a.reason,
        ip: a.ip,
        createdAt: a.createdAt.toISOString(),
      })) ?? null,
  }
}

// ---------- Status mutation ----------

export async function changeAdminUserStatus(
  actor: AdminContext,
  targetUserId: string,
  input: { status: 'ACTIVE' | 'BLOCKED'; reason: string },
  meta: SessionMeta,
): Promise<{ id: string; status: UserStatus }> {
  if (actor.userId === targetUserId) {
    throw ApiError.forbidden('تغییر وضعیت حساب خودتان مجاز نیست')
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      status: true,
      adminUser: { select: { active: true } },
    },
  })
  if (!target) throw ApiError.notFound('کاربر یافت نشد')

  // فقط SUPER_ADMIN می‌تواند وضعیت ادمین فعال را تغییر دهد
  if (target.adminUser?.active && actor.adminRole !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('تغییر وضعیت ادمین فعال فقط توسط مدیر ارشد مجاز است')
  }

  // idempotent — وضعیت یکسان = بدون تغییر و بدون audit
  if (target.status === input.status) {
    return { id: target.id, status: target.status }
  }

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    // گارد concurrency — فقط اگر وضعیت هنوز همان است
    const updated = await tx.user.updateMany({
      where: { id: targetUserId, status: target.status },
      data: { status: input.status },
    })
    if (updated.count !== 1) {
      throw ApiError.conflict('وضعیت کاربر هم‌اکنون تغییر کرده است — صفحه را تازه کنید')
    }

    // مسدودسازی → همه نشست‌های فعال بلافاصله revoke می‌شوند
    if (input.status === 'BLOCKED') {
      await tx.session.updateMany({
        where: { userId: targetUserId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      })
    }

    await tx.notification.create({
      data: {
        userId: targetUserId,
        type: input.status === 'BLOCKED' ? 'account_blocked' : 'account_activated',
        title: input.status === 'BLOCKED' ? 'حساب مسدود شد' : 'حساب فعال شد',
        body:
          input.status === 'BLOCKED'
            ? 'حساب شما توسط مرکز عملیات مسدود شد. برای پیگیری با پشتیبانی تماس بگیرید.'
            : 'حساب شما دوباره فعال شد.',
        channel: 'IN_APP',
        status: 'SENT',
      },
    })

    // audit strict — شکست آن کل transaction را rollback می‌کند
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: input.status === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_ACTIVATED',
        entityType: 'user',
        entityId: targetUserId,
        targetUserId,
        reason: input.reason,
        before: { status: target.status },
        after: { status: input.status, reason: input.reason },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })

  return { id: targetUserId, status: input.status }
}
