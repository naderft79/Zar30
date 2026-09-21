// ============================================
// Zar30 - Wallet Service
// ============================================
// تنها نقطه دسترسی به Wallet/AssetAccount کاربر
// هیچ API یا سرویس دیگری حق تغییر مستقیم balance را ندارد
// ============================================

import { Prisma, type AssetType } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { Decimal } from './money'

type Tx = Prisma.TransactionClient
type Client = Tx | typeof prisma

// اطمینان از وجود کیف پول + حساب‌های TOMAN و GOLD — idempotent
export async function ensureWallet(tx: Client, userId: string) {
  const wallet = await tx.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  const assetTypes: AssetType[] = ['TOMAN', 'GOLD']
  for (const assetType of assetTypes) {
    await tx.assetAccount.upsert({
      where: { walletId_assetType: { walletId: wallet.id, assetType } },
      update: {},
      create: { walletId: wallet.id, assetType },
    })
  }

  return tx.wallet.findUniqueOrThrow({
    where: { id: wallet.id },
    include: { assetAccounts: true },
  })
}

// حساب دارایی کاربر — ایجاد در صورت نبود
export async function ensureAssetAccount(tx: Client, userId: string, assetType: AssetType) {
  const wallet = await ensureWallet(tx, userId)
  const account = wallet.assetAccounts.find((a) => a.assetType === assetType)
  if (!account) throw new Error(`Asset account ${assetType} missing for ${userId}`)
  return account
}

// خلاصه کیف پول برای API — موجودی‌ها به صورت string امن
export async function getWalletSummary(userId: string) {
  const wallet = await ensureWallet(prisma, userId)
  const accounts = wallet.assetAccounts.map((a) => {
    const balance = new Decimal(a.balance) // موجودی آزاد
    const locked = new Decimal(a.lockedBalance)
    return {
      assetType: a.assetType,
      balance: balance.add(locked).toString(), // موجودی کل
      lockedBalance: locked.toString(),
      available: balance.toString(),
    }
  })
  return { walletId: wallet.id, status: wallet.status, accounts }
}

// تاریخچه تراکنش‌های کاربر — فقط مالک
export async function listUserTransactions(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ])
  return {
    items: items.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      status: t.status,
      journalEntryId: t.journalEntryId,
      createdAt: t.createdAt,
    })),
    total,
  }
}

// لیست واریزهای کاربر — Transaction(type=DEPOSIT)
export async function listUserDeposits(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'DEPOSIT' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId, type: 'DEPOSIT' } }),
  ])
  return {
    items: items.map((t) => ({
      id: t.id,
      amount: t.amount.toString(),
      status: t.status,
      createdAt: t.createdAt,
    })),
    total,
  }
}
