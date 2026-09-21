// ============================================
// Zar30 - Reconciliation Service
// ============================================
// تطبیق موجودی AssetAccount با مجموع ورودی‌های دفتر کل
// expected = Σ(DEBIT − CREDIT) به تفکیک balance/locked
// سیستم هرگز mismatch را خودکار اصلاح نمی‌کند — فقط گزارش
// ============================================

import prisma from '@/lib/db/prisma'
import { Decimal } from './money'

export interface ReconciliationRow {
  assetAccountId: string
  walletId: string
  userId: string
  assetType: string
  balance: string
  expectedBalance: string
  lockedBalance: string
  expectedLocked: string
  ok: boolean
}

// نگاشت code حساب → بعد موجودی
const FIELD_BY_CODE: Record<string, 'balance' | 'lockedBalance'> = {
  ASSET_TOMAN: 'balance',
  ASSET_GOLD: 'balance',
  ASSET_LOCKED_TOMAN: 'lockedBalance',
  ASSET_LOCKED_GOLD: 'lockedBalance',
}

export async function reconcileAssetAccounts(page: number, limit: number) {
  const [accounts, total] = await Promise.all([
    prisma.assetAccount.findMany({
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { wallet: { select: { userId: true } } },
    }),
    prisma.assetAccount.count(),
  ])
  if (accounts.length === 0) return { items: [] as ReconciliationRow[], total }

  const ids = accounts.map((a) => a.id)
  // مجموع ledger entries به تفکیک حساب/نوع — یک کوئری برای کل صفحه
  const sums = await prisma.ledgerEntry.groupBy({
    by: ['assetAccountId', 'ledgerAccountId', 'entryType'],
    where: { assetAccountId: { in: ids } },
    _sum: { amountToman: true, amountGold: true },
  })

  const accountCodes = new Map(
    (await prisma.ledgerAccount.findMany({ select: { id: true, code: true } })).map((a) => [
      a.id,
      a.code,
    ]),
  )

  const rows: ReconciliationRow[] = accounts.map((acct) => {
    let expectedBalance = new Decimal(0)
    let expectedLocked = new Decimal(0)

    for (const s of sums) {
      if (s.assetAccountId !== acct.id) continue
      const code = accountCodes.get(s.ledgerAccountId)
      const field = code ? FIELD_BY_CODE[code] : undefined
      if (!field) continue
      const amount =
        acct.assetType === 'GOLD'
          ? new Decimal(s._sum.amountGold ?? 0)
          : new Decimal((s._sum.amountToman ?? 0n).toString())
      const signed = s.entryType === 'DEBIT' ? amount : amount.neg()
      if (field === 'balance') expectedBalance = expectedBalance.add(signed)
      else expectedLocked = expectedLocked.add(signed)
    }

    const balance = new Decimal(acct.balance)
    const locked = new Decimal(acct.lockedBalance)
    const ok = balance.equals(expectedBalance) && locked.equals(expectedLocked)

    return {
      assetAccountId: acct.id,
      walletId: acct.walletId,
      userId: acct.wallet.userId,
      assetType: acct.assetType,
      balance: balance.toString(),
      expectedBalance: expectedBalance.toString(),
      lockedBalance: locked.toString(),
      expectedLocked: expectedLocked.toString(),
      ok,
    }
  })

  return { items: rows, total }
}
