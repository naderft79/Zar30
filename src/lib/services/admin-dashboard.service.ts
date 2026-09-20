// ============================================
// Zar30 - Admin Dashboard Service
// ============================================
// داشبورد عملیاتی واقعی — فقط PostgreSQL، هیچ داده fake
// تمام مقادیر مالی به‌صورت string برمی‌گردند (بدون حساب JS روی BigInt/Decimal)
// ============================================

import prisma from '@/lib/db/prisma'

export interface AdminDashboardData {
  generatedAt: string
  financial: {
    rialBalance: string
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
}

const DAY_MS = 24 * 60 * 60 * 1000

export async function getAdminDashboard(now = new Date()): Promise<AdminDashboardData> {
  const last24Hours = new Date(now.getTime() - DAY_MS)

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
    rialAggregate,
    goldAggregate,
    latestGoldPrice,
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
    prisma.assetAccount.aggregate({ where: { assetType: 'RIAL' }, _sum: { balance: true } }),
    prisma.assetAccount.aggregate({ where: { assetType: 'GOLD' }, _sum: { balance: true } }),
    prisma.goldPrice.findFirst({
      orderBy: { recordedAt: 'desc' },
      select: { buyPrice: true, sellPrice: true, source: true, spread: true, recordedAt: true },
    }),
  ])

  return {
    generatedAt: now.toISOString(),
    financial: {
      rialBalance: (rialAggregate._sum.balance ?? 0).toString(),
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
  }
}
