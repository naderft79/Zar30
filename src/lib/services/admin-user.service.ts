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
  /** کد معرف — نام کاربری پلتفرم */
  referralCode: string
  status: UserStatus
  kycLevel: KycLevel
  /** امتیاز اعتباری موجود دامین — risk score نیست */
  creditScore: number
  /** placeholder ساختاری — risk engine هنوز وجود ندارد */
  riskState: null
  lastLoginAt: string | null
  createdAt: string
  tomanBalance: string
  tomanLockedBalance: string
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
        tomanAmount: string
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
        referralCode: true,
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
    const toman = accounts.find((a) => a.assetType === 'TOMAN')
    const gold = accounts.find((a) => a.assetType === 'GOLD')
    return {
      id: u.id,
      mobile: u.mobile,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      referralCode: u.referralCode,
      status: u.status,
      kycLevel: u.kycLevel,
      creditScore: u.creditScore,
      riskState: null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      tomanBalance: (toman?.balance ?? 0).toString(),
      tomanLockedBalance: (toman?.lockedBalance ?? 0).toString(),
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
            tomanAmount: true,
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
        tomanAmount: o.tomanAmount.toString(),
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

// ---------- Per-user section queries (زیرصفحه‌های اختصاصی) ----------

function userName(u: {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
}) {
  return {
    id: u.id,
    mobile: u.mobile,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.mobile,
  }
}

const SECTION_TAKE = 100

export interface AdminUserBankRow {
  id: string
  bankName: string
  ibanMasked: string
  cardPanMasked: string | null
  isDefault: boolean
  blocked: boolean
  blockNote: string | null
  createdAt: string
}

export interface AdminUserSection {
  user: { id: string; mobile: string; name: string; status: string; kycLevel: string }
  kyc: {
    id: string
    level: string
    status: string
    currentStep: number
    submittedAt: string | null
    reviewedAt: string | null
    rejectionReason: string | null
  }[]
}

export async function getUserProfileAdmin(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mobile: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      status: true,
      kycLevel: true,
      creditScore: true,
      referralCode: true,
      referredBy: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      mobileVerifiedAt: true,
      lastLoginAt: true,
      lockedUntil: true,
      failedLoginAttempts: true,
      createdAt: true,
      _count: { select: { referralsMade: true } },
    },
  })
  if (!u) throw ApiError.notFound('کاربر یافت نشد')
  return {
    id: u.id,
    mobile: u.mobile,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    status: u.status,
    kycLevel: u.kycLevel,
    creditScore: u.creditScore,
    referralCode: u.referralCode,
    referredBy: u.referredBy ? userName(u.referredBy) : null,
    referralsCount: u._count.referralsMade,
    mobileVerifiedAt: u.mobileVerifiedAt?.toISOString() ?? null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    lockedUntil: u.lockedUntil?.toISOString() ?? null,
    failedLoginAttempts: u.failedLoginAttempts,
    createdAt: u.createdAt.toISOString(),
  }
}

export async function updateUserProfileByAdmin(
  actor: AdminContext,
  userId: string,
  input: { firstName?: string; lastName?: string; email?: string },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')

  // ایمیل باید یکتا باشد در صورت پر بودن
  if (input.email) {
    const dup = await prisma.user.findFirst({ where: { email: input.email, id: { not: userId } } })
    if (dup) throw ApiError.conflict('این ایمیل قبلاً برای کاربر دیگری ثبت شده است')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName || null }),
        ...(input.lastName !== undefined && { lastName: input.lastName || null }),
        ...(input.email !== undefined && { email: input.email || null }),
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.profile.update',
        entityType: 'user',
        entityId: userId,
        targetUserId: userId,
        before: { firstName: user.firstName, lastName: user.lastName, email: user.email },
        after: { firstName: input.firstName, lastName: input.lastName, email: input.email },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: updated.id }
}

export async function listUserBankAccountsAdmin(userId: string): Promise<AdminUserBankRow[]> {
  const rows = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    take: SECTION_TAKE,
  })
  return rows.map((r) => ({
    id: r.id,
    bankName: r.bankName,
    ibanMasked: `${r.iban.replace(/\s+/g, '').slice(0, 4)}••••${r.iban.replace(/\s+/g, '').slice(-4)}`,
    cardPanMasked: r.cardPan
      ? `${r.cardPan.replace(/\s+/g, '').slice(0, 6)}••••${r.cardPan.replace(/\s+/g, '').slice(-4)}`
      : null,
    isDefault: r.isDefault,
    blocked: r.blockedAt !== null,
    blockNote: r.blockNote,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function listUserKycAdmin(userId: string) {
  const rows = await prisma.kycSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
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
  return rows.map((s) => ({
    id: s.id,
    level: s.level,
    status: s.status,
    currentStep: s.currentStep,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    rejectionReason: s.rejectionReason,
  }))
}

export async function listUserOrdersAdmin(userId: string) {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
  })
  return rows.map((o) => ({
    id: o.id,
    type: o.type,
    goldAmount: o.goldAmount.toString(),
    tomanAmount: o.tomanAmount.toString(),
    unitPrice: o.unitPrice.toString(),
    fee: o.fee.toString(),
    total: o.total.toString(),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }))
}

export async function listUserTransactionsAdmin(userId: string) {
  const rows = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      type: true,
      amount: true,
      status: true,
      gatewayRef: true,
      bankRef: true,
      createdAt: true,
    },
  })
  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toString(),
    status: t.status,
    gatewayRef: t.gatewayRef,
    bankRef: t.bankRef,
    createdAt: t.createdAt.toISOString(),
  }))
}

export async function getUserWalletAdmin(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      assetAccounts: { select: { assetType: true, balance: true, lockedBalance: true } },
    },
  })
  if (!wallet) return null
  return {
    id: wallet.id,
    status: wallet.status,
    createdAt: wallet.createdAt.toISOString(),
    accounts: wallet.assetAccounts.map((a) => ({
      assetType: a.assetType,
      balance: a.balance.toString(),
      lockedBalance: a.lockedBalance.toString(),
    })),
  }
}

export async function listUserTransfersAdmin(userId: string) {
  const rows = await prisma.internalTransfer.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      assetType: true,
      tomanAmount: true,
      goldAmount: true,
      kind: true,
      status: true,
      flaggedAt: true,
      createdAt: true,
    },
  })
  return rows.map((t) => ({
    id: t.id,
    direction: t.senderId === userId ? ('out' as const) : ('in' as const),
    assetType: t.assetType,
    tomanAmount: t.tomanAmount?.toString() ?? null,
    goldAmount: t.goldAmount?.toString() ?? null,
    kind: t.kind,
    status: t.status,
    flagged: t.flaggedAt !== null,
    createdAt: t.createdAt.toISOString(),
  }))
}

export async function listUserPaymentsAdmin(userId: string) {
  const rows = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      gateway: true,
      amount: true,
      status: true,
      refId: true,
      cardPan: true,
      failureReason: true,
      verifiedAt: true,
      createdAt: true,
    },
  })
  return rows.map((p) => ({
    id: p.id,
    gateway: p.gateway,
    amount: p.amount.toString(),
    status: p.status,
    refId: p.refId,
    cardPanMasked: p.cardPan
      ? `${p.cardPan.replace(/\s+/g, '').slice(0, 6)}••••${p.cardPan.replace(/\s+/g, '').slice(-4)}`
      : null,
    failureReason: p.failureReason,
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function listUserDeliveriesAdmin(userId: string) {
  const rows = await prisma.goldDeliveryRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      grams: true,
      method: true,
      status: true,
      trackingCode: true,
      reviewNote: true,
      createdAt: true,
    },
  })
  return rows.map((d) => ({
    id: d.id,
    grams: d.grams.toString(),
    method: d.method,
    status: d.status,
    trackingCode: d.trackingCode,
    reviewNote: d.reviewNote,
    createdAt: d.createdAt.toISOString(),
  }))
}

export async function listUserInstallmentsAdmin(userId: string) {
  const rows = await prisma.installmentContract.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      principal: true,
      downPayment: true,
      totalPayable: true,
      status: true,
      method: true,
      createdAt: true,
      payments: { select: { status: true } },
    },
  })
  return rows.map((c) => ({
    id: c.id,
    principal: c.principal.toString(),
    downPayment: c.downPayment.toString(),
    totalPayable: c.totalPayable.toString(),
    status: c.status,
    method: c.method,
    paymentsTotal: c.payments.length,
    paymentsPaid: c.payments.filter((p) => p.status === 'PAID').length,
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function listUserInvestmentsAdmin(userId: string) {
  const rows = await prisma.investmentPosition.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      goldAmount: true,
      startDate: true,
      endDate: true,
      status: true,
      plan: { select: { name: true, rate: true } },
      payouts: { select: { amountGold: true } },
    },
  })
  return rows.map((p) => ({
    id: p.id,
    planName: p.plan.name,
    rate: p.plan.rate.toString(),
    goldAmount: p.goldAmount.toString(),
    paidOut: p.payouts.reduce((acc, x) => acc + Number(x.amountGold.toString()), 0).toFixed(8),
    status: p.status,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
  }))
}

export async function listUserReferralsAdmin(userId: string) {
  const rows = await prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      status: true,
      rewardAmount: true,
      rewardType: true,
      qualifiedAt: true,
      createdAt: true,
      referred: { select: { id: true, mobile: true, firstName: true, lastName: true } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    rewardAmount: r.rewardAmount?.toString() ?? null,
    rewardType: r.rewardType,
    qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    referred: userName(r.referred),
  }))
}

export async function listUserRiskEventsAdmin(userId: string) {
  const rows = await prisma.riskEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      metric: true,
      score: true,
      detail: true,
      reviewedAt: true,
      reviewNote: true,
      createdAt: true,
    },
  })
  return rows.map((r) => ({
    id: r.id,
    metric: r.metric,
    score: r.score,
    detail: r.detail,
    reviewed: r.reviewedAt !== null,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function listUserSessionsAdmin(userId: string) {
  const rows = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
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
  return rows.map((s) => ({
    id: s.id,
    deviceInfo: s.deviceInfo,
    ip: s.ip,
    userAgent: s.userAgent,
    active: s.revokedAt === null && s.expiresAt > new Date(),
    expiresAt: s.expiresAt.toISOString(),
    revokedAt: s.revokedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }))
}

export async function listUserNotificationsAdmin(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SECTION_TAKE,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      channel: true,
      status: true,
      createdAt: true,
    },
  })
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    channel: n.channel,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function getUserFeeOverrideAdmin(userId: string) {
  const row = await prisma.userFeeOverride.findUnique({ where: { userId } })
  return row
    ? {
        buyFeeBps: row.buyFeeBps,
        sellFeeBps: row.sellFeeBps,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
      }
    : null
}

export async function setUserFeeOverrideByAdmin(
  actor: AdminContext,
  userId: string,
  input: { buyFeeBps: number | null; sellFeeBps: number | null; note?: string },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')
  await prisma.$transaction(async (tx) => {
    const before = await tx.userFeeOverride.findUnique({ where: { userId } })
    await tx.userFeeOverride.upsert({
      where: { userId },
      update: {
        buyFeeBps: input.buyFeeBps,
        sellFeeBps: input.sellFeeBps,
        note: input.note ?? null,
      },
      create: {
        userId,
        buyFeeBps: input.buyFeeBps,
        sellFeeBps: input.sellFeeBps,
        note: input.note ?? null,
        createdBy: actor.adminId,
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: before ? 'user.fee.update' : 'user.fee.create',
        entityType: 'user_fee_override',
        entityId: userId,
        targetUserId: userId,
        before: before ?? undefined,
        after: input,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { ok: true }
}

export async function changeUserLevelByAdmin(
  actor: AdminContext,
  userId: string,
  input: { kycLevel: 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'; reason: string },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, kycLevel: true },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')
  if (user.kycLevel === input.kycLevel) return { id: userId, kycLevel: user.kycLevel }
  await prisma.$transaction(async (tx) => {
    const saved = await tx.user.update({
      where: { id: userId },
      data: { kycLevel: input.kycLevel },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.level.change',
        entityType: 'user',
        entityId: userId,
        targetUserId: userId,
        reason: input.reason,
        before: { kycLevel: user.kycLevel },
        after: { kycLevel: input.kycLevel },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: userId, kycLevel: input.kycLevel }
}

export async function setUserCreditByAdmin(
  actor: AdminContext,
  userId: string,
  input: { creditScore: number; reason: string },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, creditScore: true },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')
  if (user.creditScore === input.creditScore) return { id: userId, creditScore: user.creditScore }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { creditScore: input.creditScore },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.credit.set',
        entityType: 'user',
        entityId: userId,
        targetUserId: userId,
        reason: input.reason,
        before: { creditScore: user.creditScore },
        after: { creditScore: input.creditScore },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { id: userId, creditScore: input.creditScore }
}

export async function addUserRiskEventByAdmin(
  actor: AdminContext,
  userId: string,
  input: { metric: string; score: number; note?: string },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')
  const event = await prisma.$transaction(async (tx) => {
    const saved = await tx.riskEvent.create({
      data: {
        userId,
        metric: input.metric,
        score: input.score,
        detail: input.note ? { note: input.note } : undefined,
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.risk.signal',
        entityType: 'risk_event',
        entityId: saved.id,
        targetUserId: userId,
        reason: input.note,
        after: { metric: input.metric, score: input.score },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: event.id }
}

export async function sendUserMessageByAdmin(
  actor: AdminContext,
  userId: string,
  input: { title: string; body: string; channel: 'SMS' | 'IN_APP' | 'PUSH' },
  meta: SessionMeta,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, mobile: true, status: true },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')
  if (user.status === 'DELETED') throw ApiError.badRequest('ارسال به کاربر حذف‌شده مجاز نیست')

  const notification = await prisma.$transaction(async (tx) => {
    const saved = await tx.notification.create({
      data: {
        userId,
        type: 'admin_message',
        title: input.title,
        body: input.body,
        channel: input.channel,
        status: input.channel === 'SMS' ? 'SENT' : 'SENT',
        sentAt: new Date(),
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.message.send',
        entityType: 'notification',
        entityId: saved.id,
        targetUserId: userId,
        after: { title: input.title, channel: input.channel },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: notification.id }
}

// همگام‌سازی سفارشات — بازمحاسبه موجودی کیف پول از دفتر کل
// برای رفع ناهماهنگی‌های نمایشی؛ هیچ leg جدیدی ثبت نمی‌کند
export async function syncUserOrdersAdmin(actor: AdminContext, userId: string, meta: SessionMeta) {
  const accounts = await prisma.assetAccount.findMany({
    where: { wallet: { userId } },
    select: { id: true, assetType: true, balance: true, lockedBalance: true },
  })
  const result: { assetType: string; before: string; after: string; changed: boolean }[] = []
  for (const acc of accounts) {
    const sums = await prisma.$queryRawUnsafe<Array<{ posted: string | null }>>(
      `SELECT
         COALESCE(SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount_toman ELSE 0 END), 0)::text
         - COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount_toman ELSE 0 END), 0)::text AS posted
       FROM ledger_entries le WHERE le.asset_account_id = $1`,
      acc.id,
    )
    // برای حساب طلایی ستون amount_gold استفاده می‌شود — query جداگانه
    const goldSums = await prisma.$queryRawUnsafe<Array<{ posted: string | null }>>(
      `SELECT
         COALESCE(SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount_gold ELSE 0 END), 0)::text
         - COALESCE(SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount_gold ELSE 0 END), 0)::text AS posted
       FROM ledger_entries le WHERE le.asset_account_id = $1`,
      acc.id,
    )
    const field = acc.assetType === 'GOLD' ? 'amount_gold' : 'amount_toman'
    const raw = field === 'amount_gold' ? goldSums[0]?.posted : sums[0]?.posted
    // نرمال‌سازی — حذف اعشار صفر برای تومان
    const normalized =
      acc.assetType === 'GOLD' ? (raw ?? '0') : String(BigInt(Math.trunc(Number(raw ?? '0'))))
    const changed = normalized !== acc.balance.toString()
    result.push({
      assetType: acc.assetType,
      before: acc.balance.toString(),
      after: normalized,
      changed,
    })
  }

  // فقط گزارش — بازنویسی موجودی عملیات حساس مالی است و در این نسخه ثبت می‌شود
  await prisma.$transaction(async (tx) => {
    for (const r of result) {
      if (!r.changed) continue
      const acc = accounts.find((a) => a.assetType === r.assetType)
      if (!acc) continue
      await tx.assetAccount.update({
        where: { id: acc.id },
        data: { balance: r.after },
      })
    }
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.orders.sync',
        entityType: 'user',
        entityId: userId,
        targetUserId: userId,
        before: Object.fromEntries(result.map((r) => [r.assetType, r.before])),
        after: Object.fromEntries(result.map((r) => [r.assetType, r.after])),
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { accounts: result }
}

// لغو همه نشست‌های فعال کاربر — بدون تغییر وضعیت حساب
export async function revokeUserSessionsByAdmin(
  actor: AdminContext,
  userId: string,
  reason: string,
  meta: SessionMeta,
) {
  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.session.updateMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'user.sessions.revoke',
        entityType: 'user',
        entityId: userId,
        targetUserId: userId,
        reason,
        after: { revokedCount: updated.count },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return updated.count
  })
  return { revoked: result }
}
