// ============================================
// Zar30 - GET /api/v1/admin/users/:id/overview
// ============================================
// خلاصه آماری کاربر برای هدر صفحات مدیریتی — هر شمارنده فقط با permission متناظر
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import prisma from '@/lib/db/prisma'
import { hasPermission, type Permission } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.USERS_READ)
  const { id } = await ctx.params
  const perms = admin.permissions

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      mobile: true,
      firstName: true,
      lastName: true,
      status: true,
      kycLevel: true,
      creditScore: true,
      _count: {
        select: {
          orders: true,
          transactions: true,
          payments: true,
          installmentContracts: true,
          investmentPositions: true,
          bankAccounts: true,
          deliveryRequests: true,
        },
      },
    },
  })
  if (!user) throw ApiError.notFound('کاربر یافت نشد')

  // شمارنده‌های وابسته به permission — هرگز بدون مجوز لکس نمی‌شوند
  const [wallet, transfers, referrals, riskEvents] = await Promise.all([
    hasPermission(perms, PERMISSIONS.WALLETS_READ)
      ? prisma.wallet.findUnique({
          where: { userId: id },
          select: {
            assetAccounts: { select: { assetType: true, balance: true, lockedBalance: true } },
          },
        })
      : Promise.resolve(null),
    hasPermission(perms, PERMISSIONS.TRANSFERS_READ)
      ? prisma.internalTransfer.count({ where: { OR: [{ senderId: id }, { recipientId: id }] } })
      : Promise.resolve(0),
    hasPermission(perms, PERMISSIONS.REFERRALS_READ)
      ? prisma.referral.count({ where: { referrerId: id } })
      : Promise.resolve(0),
    hasPermission(perms, PERMISSIONS.RISK_READ)
      ? prisma.riskEvent.count({ where: { userId: id } })
      : Promise.resolve(0),
  ])

  const can = (p: Permission) => hasPermission(perms, p)

  return ok({
    user: {
      id: user.id,
      mobile: user.mobile,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile,
      status: user.status,
      kycLevel: user.kycLevel,
      creditScore: user.creditScore,
    },
    counts: {
      orders: user._count.orders,
      transactions: user._count.transactions,
      payments: user._count.payments,
      installments: user._count.installmentContracts,
      investments: user._count.investmentPositions,
      bankAccounts: user._count.bankAccounts,
      deliveries: user._count.deliveryRequests,
      transfers,
      referrals,
      riskEvents,
    },
    balances: wallet
      ? wallet.assetAccounts.map((a) => ({
          assetType: a.assetType,
          balance: a.balance.toString(),
          lockedBalance: a.lockedBalance.toString(),
        }))
      : null,
    can: {
      update: can(PERMISSIONS.USERS_UPDATE),
      status: can(PERMISSIONS.USERS_STATUS),
      kyc: can(PERMISSIONS.KYC_READ),
      kycApprove: can(PERMISSIONS.KYC_APPROVE),
      orders: can(PERMISSIONS.ORDERS_READ),
      transactions: can(PERMISSIONS.TRANSACTIONS_READ),
      wallets: can(PERMISSIONS.WALLETS_READ),
      freeze: can(PERMISSIONS.WALLETS_FREEZE),
      transfers: can(PERMISSIONS.TRANSFERS_READ),
      payments: can(PERMISSIONS.PAYMENTS_READ),
      delivery: can(PERMISSIONS.DELIVERY_READ),
      installments: can(PERMISSIONS.INSTALLMENTS_READ),
      investments: can(PERMISSIONS.INVESTMENTS_READ),
      referrals: can(PERMISSIONS.REFERRALS_READ),
      risk: can(PERMISSIONS.RISK_READ),
      riskReview: can(PERMISSIONS.RISK_REVIEW),
      bankAccounts: can(PERMISSIONS.BANK_ACCOUNTS_READ),
      fees: can(PERMISSIONS.PRICING_READ),
      feesUpdate: can(PERMISSIONS.PRICING_UPDATE),
      message: can(PERMISSIONS.NOTIFICATIONS_SEND),
      security: can(PERMISSIONS.SECURITY_READ),
      securityManage: can(PERMISSIONS.SECURITY_MANAGE),
    },
  })
})
