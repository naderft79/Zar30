// ============================================
// Zar30 - Admin Dashboard Service
// ============================================
// داشبورد عملیاتی واقعی — فقط PostgreSQL، هیچ داده fake
// تمام مقادیر مالی به‌صورت string برمی‌گردند (بدون حساب JS روی BigInt/Decimal)
// ============================================

import prisma from '@/lib/db/prisma'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'

export interface AdminDashboardData {
  generatedAt: string
  financial: {
    tomanBalance: string
    goldBalance: string
    completedVolumeLast24Hours: string
    pendingWithdrawals: number
    latestGoldPrice: null | {
      buyPrice: string
      sellPrice: string
      source: string
      spread: string
      recordedAt: string
    }
  }
  customers: {
    total: number
    active: number
    newLast24Hours: number
  }
  kyc: {
    submitted: number
    underReview: number
    approved: number
    needsAction: number
  }
  operations: {
    pendingOrders: number
    openTickets: number
    failedTransactions: number
  }
  /** روند ۳۰ روز اخیر — برای نمودار داشبورد؛ volume به تومان (نمایشی، نه ledger) */
  trend: { day: string; txVolume: number; orders: number; newUsers: number }[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export async function getAdminDashboard(now = new Date()): Promise<AdminDashboardData> {
  const last24Hours = new Date(now.getTime() - DAY_MS)
  const trendFrom = new Date(now.getTime() - 29 * DAY_MS)
  trendFrom.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    activeUsers,
    newUsers,
    kycSubmitted,
    kycUnderReview,
    kycApproved,
    kycNeedsAction,
    pendingOrders,
    pendingWithdrawals,
    openTickets,
    failedTransactions,
    completedVolume,
    tomanAggregate,
    goldAggregate,
    latestGoldPrice,
    trendRows,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.kycSubmission.count({ where: { status: 'SUBMITTED' } }),
    prisma.kycSubmission.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.kycSubmission.count({ where: { status: 'APPROVED' } }),
    prisma.kycSubmission.count({ where: { status: { in: ['REJECTED', 'NEEDS_RESUBMISSION'] } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'LOCKED'] } } }),
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.transaction.count({ where: { status: 'FAILED' } }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: last24Hours } },
      _sum: { amount: true },
    }),
    prisma.assetAccount.aggregate({ where: { assetType: 'TOMAN' }, _sum: { balance: true } }),
    prisma.assetAccount.aggregate({ where: { assetType: 'GOLD' }, _sum: { balance: true } }),
    prisma.goldPrice.findFirst({
      orderBy: { recordedAt: 'desc' },
      select: { buyPrice: true, sellPrice: true, source: true, spread: true, recordedAt: true },
    }),
    // سری روزانه ۳۰ روز — یک کوئری با generate_series؛ خروجی فقط برای نمودار است
    prisma.$queryRaw<{ day: Date; tx_volume: bigint; orders: bigint; users: bigint }[]>`
      SELECT d::date AS day,
        COALESCE(tx.volume, 0)::bigint AS tx_volume,
        COALESCE(o.cnt, 0)::bigint AS orders,
        COALESCE(u.cnt, 0)::bigint AS users
      FROM generate_series(${trendFrom}::date, ${now}::date, interval '1 day') AS d
      LEFT JOIN (
        SELECT created_at::date AS day, SUM(amount) AS volume
        FROM transactions
        WHERE status = 'COMPLETED' AND created_at >= ${trendFrom}
        GROUP BY 1
      ) tx ON tx.day = d::date
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*) AS cnt
        FROM orders
        WHERE status = 'FILLED' AND created_at >= ${trendFrom}
        GROUP BY 1
      ) o ON o.day = d::date
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*) AS cnt
        FROM users
        WHERE created_at >= ${trendFrom}
        GROUP BY 1
      ) u ON u.day = d::date
      ORDER BY day
    `,
  ])

  return {
    generatedAt: now.toISOString(),
    financial: {
      tomanBalance: (tomanAggregate._sum.balance ?? 0).toString(),
      goldBalance: (goldAggregate._sum.balance ?? 0).toString(),
      completedVolumeLast24Hours: (completedVolume._sum.amount ?? 0).toString(),
      pendingWithdrawals,
      latestGoldPrice: latestGoldPrice
        ? {
            buyPrice: latestGoldPrice.buyPrice.toString(),
            sellPrice: latestGoldPrice.sellPrice.toString(),
            source: latestGoldPrice.source,
            spread: latestGoldPrice.spread.toString(),
            recordedAt: latestGoldPrice.recordedAt.toISOString(),
          }
        : null,
    },
    customers: {
      total: totalUsers,
      active: activeUsers,
      newLast24Hours: newUsers,
    },
    kyc: {
      submitted: kycSubmitted,
      underReview: kycUnderReview,
      approved: kycApproved,
      needsAction: kycNeedsAction,
    },
    operations: {
      pendingOrders,
      openTickets,
      failedTransactions,
    },
    trend: trendRows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      txVolume: Number(r.tx_volume),
      orders: Number(r.orders),
      newUsers: Number(r.users),
    })),
  }
}

// ============================================
// Nav Badges — شمارنده‌های pending برای سایدبار ادمین
// ============================================

export interface AdminNavBadgeCounts {
  kyc?: number
  withdrawals?: number
  orders?: number
  tickets?: number
  risk?: number
  delivery?: number
}

/**
 * شمارنده‌های pending — فقط برای دامنه‌هایی که ادمین permission خواندنش را دارد.
 * خروجی خالی = بدون badge؛ هر شماره صفر هم ارسال نمی‌شود تا UI خلوت بماند.
 */
export async function getAdminNavBadges(
  permissions: readonly Permission[],
): Promise<AdminNavBadgeCounts> {
  const badges: AdminNavBadgeCounts = {}
  const tasks: Promise<void>[] = []

  if (hasPermission(permissions, PERMISSIONS.KYC_READ)) {
    tasks.push(
      prisma.kycSubmission
        .count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } })
        .then((n) => {
          if (n > 0) badges.kyc = n
        }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.WITHDRAWALS_READ)) {
    tasks.push(
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }).then((n) => {
        if (n > 0) badges.withdrawals = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.ORDERS_READ)) {
    tasks.push(
      prisma.order.count({ where: { status: { in: ['PENDING', 'LOCKED'] } } }).then((n) => {
        if (n > 0) badges.orders = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.TICKETS_READ)) {
    tasks.push(
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }).then((n) => {
        if (n > 0) badges.tickets = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.RISK_READ)) {
    tasks.push(
      prisma.riskEvent.count({ where: { reviewedAt: null } }).then((n) => {
        if (n > 0) badges.risk = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.DELIVERY_READ)) {
    tasks.push(
      prisma.goldDeliveryRequest
        .count({ where: { status: { in: ['PENDING', 'PREPARING'] } } })
        .then((n) => {
          if (n > 0) badges.delivery = n
        }),
    )
  }

  await Promise.all(tasks)
  return badges
}
