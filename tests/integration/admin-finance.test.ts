// ============================================
// Zar30 - Admin Finance Integration Tests
// ============================================
// Read-only explorer روی PostgreSQL واقعی — serialization دقیق BigInt/Decimal
// داده تست مستقیم در DB ساخته می‌شود (فقط read تست می‌شود)
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'
import {
  getAdminAccountDetail,
  getAdminGoldHoldings,
  getAdminOrderDetail,
  getAdminTransactionDetail,
  getAdminWalletDetail,
  getAdminWithdrawalDetail,
  listAdminAccounts,
  listAdminDeposits,
  listAdminPrices,
  listAdminTransactions,
  listAdminWallets,
  listAdminWithdrawals,
} from '@/lib/services/admin-finance.service'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }

function uniqueMobile() {
  return `0914${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function createVerifiedUser() {
  const mobile = uniqueMobile()
  await register({ mobile, password: 'Test@1234' }, meta)
  const code = await redis.get(`devotp:${mobile}`)
  await verifyRegisterOtp(mobile, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

async function createWalletWithAccounts(userId: string) {
  const wallet = await prisma.wallet.create({ data: { userId } })
  const rial = await prisma.assetAccount.create({
    data: {
      walletId: wallet.id,
      assetType: 'RIAL',
      // بیشینه دقت numeric(18,8) — float64 نمی‌تواند دقیق نگه دارد
      balance: '9999999999.99999999',
      lockedBalance: '5',
    },
  })
  const gold = await prisma.assetAccount.create({
    data: { walletId: wallet.id, assetType: 'GOLD', balance: '12.34567890' },
  })
  return { wallet, rial, gold }
}

describe('Admin Finance — Accounts/Wallets/Gold', () => {
  it('accounts list — pagination + Decimal های بزرگ دقیقاً string می‌مانند', async () => {
    const user = await createVerifiedUser()
    const { rial } = await createWalletWithAccounts(user.id)

    const { rows, total } = await listAdminAccounts({
      page: 1,
      limit: 10,
      q: user.mobile,
      direction: 'desc',
    })
    expect(total).toBeGreaterThanOrEqual(2)
    const row = rows.find((r) => r.id === rial.id)!
    expect(row.balance).toBe('9999999999.99999999')
    expect(row.wallet.user.mobile).toBe(user.mobile)
    // هیچ Number/BigInt/Decimal شیء در خروجی نیست
    expect(JSON.parse(JSON.stringify(row)).balance).toBe('9999999999.99999999')
  })

  it('account detail — آخرین ledger entries با journal/account', async () => {
    const user = await createVerifiedUser()
    const { rial } = await createWalletWithAccounts(user.id)
    const ledgerAccount = await prisma.ledgerAccount.create({
      data: { code: `TEST-${rial.id.slice(0, 8)}`, type: 'ASSET', name: 'تست', assetType: 'RIAL' },
    })
    const journal = await prisma.journalEntry.create({
      data: { referenceType: 'test', referenceId: rial.id, description: 'تست' },
    })
    await prisma.ledgerEntry.create({
      data: {
        journalEntryId: journal.id,
        ledgerAccountId: ledgerAccount.id,
        entryType: 'DEBIT',
        amountRial: 1000n,
        balanceAfter: '1000',
        assetAccountId: rial.id,
      },
    })

    const detail = await getAdminAccountDetail(rial.id)
    expect(detail.ledgerEntries.length).toBe(1)
    expect(detail.ledgerEntries[0]!.amountRial).toBe('1000')
    expect(detail.ledgerEntries[0]!.entryType).toBe('DEBIT')
    expect(detail.ledgerEntries[0]!.ledgerAccount.code).toContain('TEST-')
    expect(detail.wallet.user.id).toBe(user.id)

    await expect(getAdminAccountDetail('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /یافت نشد/,
    )
  })

  it('wallets list/detail — حساب‌ها + تراکنش‌ها', async () => {
    const user = await createVerifiedUser()
    const { wallet } = await createWalletWithAccounts(user.id)

    const { rows } = await listAdminWallets({
      page: 1,
      limit: 10,
      q: user.mobile,
      direction: 'desc',
    })
    const row = rows.find((r) => r.id === wallet.id)!
    expect(row.accounts.some((a) => a.assetType === 'GOLD')).toBe(true)

    const detail = await getAdminWalletDetail(wallet.id)
    expect(detail.user.id).toBe(user.id)
    expect(detail.accounts.map((a) => a.assetType)).toContain('RIAL')
  })

  it('gold holdings — aggregate دقیق و لیست GOLD', async () => {
    const user = await createVerifiedUser()
    const { gold } = await createWalletWithAccounts(user.id)

    const res = await getAdminGoldHoldings({ page: 1, limit: 100 })
    expect(res.summary.accountsCount).toBeGreaterThanOrEqual(1)
    expect(typeof res.summary.balance).toBe('string')
    expect(res.rows.every((r) => r.assetType === 'GOLD')).toBe(true)
    expect(res.rows.some((r) => r.id === gold.id)).toBe(true)
  })
})

describe('Admin Finance — Orders/Transactions/Deposits', () => {
  it('transaction detail — زنجیره journal + دو entry متوازن + audit', async () => {
    const user = await createVerifiedUser()
    const { wallet, rial } = await createWalletWithAccounts(user.id)
    const ledgerAccount = await prisma.ledgerAccount.create({
      data: {
        code: `REV-${rial.id.slice(0, 8)}`,
        type: 'REVENUE',
        name: 'تست درآمد',
        assetType: 'RIAL',
      },
    })
    const journal = await prisma.journalEntry.create({
      data: { referenceType: 'transaction', description: 'واریز تست' },
    })
    await prisma.ledgerEntry.createMany({
      data: [
        {
          journalEntryId: journal.id,
          ledgerAccountId: ledgerAccount.id,
          entryType: 'DEBIT',
          amountRial: 5000n,
          balanceAfter: '5000',
          assetAccountId: rial.id,
        },
        {
          journalEntryId: journal.id,
          ledgerAccountId: ledgerAccount.id,
          entryType: 'CREDIT',
          amountRial: 5000n,
          balanceAfter: null,
          assetAccountId: null,
        },
      ],
    })
    const tx = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        type: 'DEPOSIT',
        amount: 5000n,
        status: 'COMPLETED',
        journalEntryId: journal.id,
      },
    })
    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        action: 'TEST_DEPOSIT',
        entityType: 'transaction',
        entityId: tx.id,
      },
    })
    // collision: همان entityId ولی entityType متفاوت — نباید برگردد
    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        action: 'ORDER_EVENT',
        entityType: 'order',
        entityId: tx.id,
      },
    })

    const detail = await getAdminTransactionDetail(tx.id)
    expect(detail.amount).toBe('5000')
    expect(detail.wallet?.id).toBe(wallet.id)
    expect(detail.journal?.ledgerEntries).toHaveLength(2)
    expect(detail.journal?.ledgerEntries.map((e) => e.entryType).sort()).toEqual([
      'CREDIT',
      'DEBIT',
    ])
    expect(detail.audit.some((a) => a.action === 'TEST_DEPOSIT')).toBe(true)
    expect(detail.audit.some((a) => a.action === 'ORDER_EVENT')).toBe(false)
  })

  it('deposits — فقط type=DEPOSIT برمی‌گردد، WITHDRAW هرگز', async () => {
    const user = await createVerifiedUser()
    const { wallet } = await createWalletWithAccounts(user.id)
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        type: 'DEPOSIT',
        amount: 100n,
        status: 'COMPLETED',
      },
    })
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        type: 'WITHDRAW',
        amount: 200n,
        status: 'COMPLETED',
      },
    })

    const { rows } = await listAdminDeposits({
      page: 1,
      limit: 100,
      q: user.mobile,
      direction: 'desc',
    })
    expect(rows.length).toBeGreaterThanOrEqual(1)
    expect(rows.every((r) => r.type === 'DEPOSIT')).toBe(true)

    // فیلتر status روی deposits هم کار می‌کند
    const failed = await listAdminDeposits({
      page: 1,
      limit: 100,
      q: user.mobile,
      status: 'FAILED',
      direction: 'desc',
    })
    expect(failed.rows.length).toBe(0)

    // list کامل transactions هر دو نوع را دارد
    const all = await listAdminTransactions({
      page: 1,
      limit: 100,
      q: user.mobile,
      direction: 'desc',
    })
    expect(all.rows.some((r) => r.type === 'WITHDRAW')).toBe(true)
  })

  it('orders detail — journal + audit؛ missing → 404', async () => {
    const user = await createVerifiedUser()
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        type: 'BUY',
        goldAmount: '1.5',
        rialAmount: 10_000_000n,
        unitPrice: 6_666_666n,
        spread: '0.5',
        fee: 1000n,
        total: 10_001_000n,
        status: 'FILLED',
      },
    })

    const detail = await getAdminOrderDetail(order.id)
    expect(detail.total).toBe('10001000')
    // Decimal به صورت string دقیق برمی‌گردد — نرمال‌شده Prisma
    expect(detail.goldAmount).toBe('1.5')
    expect(detail.user.id).toBe(user.id)
    expect(detail.journal).toBeNull() // سفارش تست journal ندارد — صادقانه null

    await expect(getAdminOrderDetail('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /یافت نشد/,
    )
  })
})

describe('Admin Finance — Withdrawals/Pricing', () => {
  it('withdrawal — شبای خام در هیچ کجای JSON برنمی‌گردد؛ فقط masked', async () => {
    const user = await createVerifiedUser()
    const rawIban = 'IR062960000000100324200001'
    const w = await prisma.withdrawalRequest.create({
      data: { userId: user.id, amount: 250_000n, iban: rawIban, status: 'PENDING' },
    })

    const { rows } = await listAdminWithdrawals({
      page: 1,
      limit: 100,
      q: user.mobile,
      direction: 'desc',
    })
    const row = rows.find((r) => r.id === w.id)!
    expect(row.ibanMasked).not.toBe(rawIban)
    expect(row.ibanMasked).toContain(rawIban.slice(-4))
    expect(JSON.stringify(row)).not.toContain(rawIban)

    const detail = await getAdminWithdrawalDetail(w.id)
    expect(detail.ibanMasked).not.toBe(rawIban)
    expect(JSON.stringify(detail)).not.toContain(rawIban)
    expect(detail.amount).toBe('250000')

    await expect(getAdminWithdrawalDetail('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /یافت نشد/,
    )
  })

  it('pricing — BigInt بالای ۲^۵۳ دقیقاً string؛ latest مستقل از صفحه', async () => {
    const huge = 9007199254740993n // > Number.MAX_SAFE_INTEGER
    await prisma.goldPrice.create({
      data: {
        buyPrice: huge,
        sellPrice: huge - 1000n,
        rawPrice: huge,
        spread: '0.25',
        source: 'vitest-mock',
        recordedAt: new Date('2030-01-01T00:00:00Z'),
      },
    })

    // latest مستقل از صفحه/direction — همان آخرین global
    const paged = await listAdminPrices({ page: 5, limit: 3, direction: 'asc' })
    expect(paged.latest?.buyPrice).toBe(huge.toString())

    // فیلتر source — رکورد با مقدار >2^53 دقیقاً string برمی‌گردد
    const filtered = await listAdminPrices({
      page: 1,
      limit: 10,
      source: 'vitest-mock',
      direction: 'desc',
    })
    const target = filtered.rows.find((p) => p.source === 'vitest-mock')
    expect(target?.buyPrice).toBe(huge.toString())
    expect(target?.sellPrice).toBe((huge - 1000n).toString())
  })
})
