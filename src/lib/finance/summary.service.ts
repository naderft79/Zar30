// ============================================
// Zar30 - Financial Summary Service (Assets v2)
// ============================================
// خلاصه یکپارچه صفحه دارایی‌ها — یک endpoint به‌جای چند fetch
//   موجودی‌ها، تراکنش‌های pending، وضعیت اقساط/تحویل/SIP
// ============================================

import prisma from '@/lib/db/prisma'
import { Decimal } from './money'

export async function getFinancialSummary(userId: string) {
  const [
    wallet,
    pendingDeposits,
    pendingWithdrawals,
    deliveries,
    sipPlans,
    alerts,
    bankAccounts,
    addresses,
    installmentContracts,
  ] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      include: { assetAccounts: true },
    }),
    prisma.transaction.count({
      where: { userId, type: 'DEPOSIT', status: 'PENDING' },
    }),
    prisma.withdrawalRequest.count({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
    }),
    prisma.goldDeliveryRequest.count({
      where: { userId, status: { in: ['PENDING', 'APPROVED', 'SHIPPED'] } },
    }),
    prisma.recurringBuyPlan.count({ where: { userId, active: true } }),
    prisma.priceAlert.count({ where: { userId, active: true } }),
    prisma.bankAccount.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
    prisma.installmentContract.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        totalPayable: true,
        payments: {
          where: { status: 'PAID' },
          select: { amount: true },
        },
      },
    }),
  ])

  const toman = wallet?.assetAccounts.find((a) => a.assetType === 'TOMAN')
  const gold = wallet?.assetAccounts.find((a) => a.assetType === 'GOLD')

  // میانگین قیمت خرید طلای کاربر — مبنای محاسبه سود/زیان در UI
  const buyAgg = await prisma.order.aggregate({
    where: { userId, type: 'BUY', status: 'FILLED' },
    _sum: { tomanAmount: true, goldAmount: true },
  })
  const avgBuyPrice =
    buyAgg._sum.goldAmount && Number(buyAgg._sum.goldAmount) > 0 && buyAgg._sum.tomanAmount
      ? Number(buyAgg._sum.tomanAmount) / Number(buyAgg._sum.goldAmount)
      : null

  // تغییر قیمت فروش نسبت به ۲۴ ساعت قبل — برای TrendBadge هیرو
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [latest, previous] = await Promise.all([
    prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } }),
    prisma.goldPrice.findFirst({
      where: { recordedAt: { lte: dayAgo } },
      orderBy: { recordedAt: 'desc' },
    }),
  ])
  const priceChange24h =
    latest && previous && previous.sellPrice > 0n
      ? (Number(latest.sellPrice - previous.sellPrice) / Number(previous.sellPrice)) * 100
      : null

  return {
    tomanBalance: new Decimal(toman?.balance ?? 0).toFixed(0),
    tomanLocked: new Decimal(toman?.lockedBalance ?? 0).toFixed(0),
    goldBalance: new Decimal(gold?.balance ?? 0).toString(),
    goldLocked: new Decimal(gold?.lockedBalance ?? 0).toString(),
    avgBuyPrice,
    sellPrice: latest ? latest.sellPrice.toString() : null,
    buyPrice: latest ? latest.buyPrice.toString() : null,
    priceChange24h,
    pendingDeposits,
    pendingWithdrawals,
    installments: {
      activeContracts: installmentContracts.length,
      totalPayable: installmentContracts.reduce((acc, c) => acc + c.totalPayable, 0n).toString(),
      paid: installmentContracts
        .reduce((acc, c) => acc + c.payments.reduce((p, pay) => p + pay.amount, 0n), 0n)
        .toString(),
      remaining: installmentContracts
        .reduce(
          (acc, c) => acc + (c.totalPayable - c.payments.reduce((p, pay) => p + pay.amount, 0n)),
          0n,
        )
        .toString(),
    },
    activeDeliveries: deliveries,
    activeSavingsPlans: sipPlans,
    activePriceAlerts: alerts,
    bankAccounts,
    addresses,
  }
}
