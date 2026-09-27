// ============================================
// Zar30 - Trade Quote Service Integration Test
// ============================================
// پیش‌نمایش معامله روی PostgreSQL واقعی:
//   خرید TOMAN→گرم | خرید GOLD→تومان | فروش + کارمزد
//   سازگاری پیش‌نمایش با اجرای واقعی (buyGold/sellGold)
//   سقف روزانه و موجودی در پاسخ
// پیش‌نیاز: docker compose up -d && prisma migrate deploy && db:seed
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { ensureWallet } from '../../src/lib/finance/wallet.service'
import { buyGold } from '../../src/lib/finance/order.service'
import { getTradeQuote } from '../../src/lib/finance/quote.service'
import { recordPrice } from '../../src/lib/finance/pricing.service'
import { requestDeposit, creditDeposit } from '../../src/lib/finance/deposit.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

let ADMIN = { adminId: '', adminRole: 'SUPER_ADMIN' }
const AUDIT = {}
const PRICE_BUY = 8_500_000n
const PRICE_SELL = 8_450_000n

async function fundUser(userId: string, amount: bigint) {
  const dep = await requestDeposit({ userId, kycLevel: 'LEVEL_3' }, { amount })
  await creditDeposit(ADMIN, dep.id, AUDIT)
}

describe('Trade Quote Service (Real PostgreSQL)', () => {
  let userId: string

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0914${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}D`,
        kycLevel: 'LEVEL_3',
      },
    })
    userId = u.id
    await ensureWallet(prisma, userId)

    const adminUser = await prisma.user.create({
      data: {
        mobile: `0915${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}E`,
        kycLevel: 'LEVEL_3',
      },
    })
    const admin = await prisma.adminUser.create({
      data: { userId: adminUser.id, role: 'SUPER_ADMIN', permissions: [] },
    })
    ADMIN = { adminId: admin.id, adminRole: 'SUPER_ADMIN' }

    await prisma.goldPrice.deleteMany({ where: { recordedAt: { gt: new Date() } } })
    await recordPrice({
      buyPrice: PRICE_BUY,
      sellPrice: PRICE_SELL,
      source: 'test',
      allowAbnormal: true,
    })
  })

  afterAll(async () => {
    const wallets = await prisma.wallet.findMany({ where: { userId } })
    const accts = await prisma.assetAccount.findMany({
      where: { walletId: { in: wallets.map((w) => w.id) } },
    })
    const entries = await prisma.ledgerEntry.findMany({
      where: { assetAccountId: { in: accts.map((a) => a.id) } },
      select: { journalEntryId: true },
    })
    const orderJournals = await prisma.journalEntry.findMany({
      where: { referenceType: 'ORDER', referenceId: userId },
      select: { id: true },
    })
    const journalIds = [...entries.map((e) => e.journalEntryId), ...orderJournals.map((j) => j.id)]
    await prisma.ledgerEntry.deleteMany({
      where: { journalEntryId: { in: journalIds } },
    })
    await prisma.journalEntry.deleteMany({
      where: { id: { in: journalIds } },
    })
    await prisma.order.deleteMany({ where: { userId } })
    await prisma.transaction.deleteMany({ where: { userId } })
    await prisma.assetAccount.deleteMany({ where: { walletId: { in: wallets.map((w) => w.id) } } })
    await prisma.wallet.deleteMany({ where: { userId } })
    await prisma.priceAlert.deleteMany({ where: { userId } })
    await prisma.notification.deleteMany({ where: { userId } })
    await prisma.goldPrice.deleteMany({ where: { source: 'test' } })
    await prisma.user.deleteMany({ where: { id: { in: [userId] } } })
  })

  it('خرید به تومان — طلا = مبلغ / قیمت خرید و کارمزد درست', async () => {
    await fundUser(userId, 100_000_000n)
    const ctx = { userId, kycLevel: 'LEVEL_3' as const }
    const quote = await getTradeQuote(ctx, { side: 'BUY', inputType: 'TOMAN', amount: '1000000' })

    expect(quote.side).toBe('BUY')
    // 1,000,000 / 8,500,000 = 0.11764705 گرم
    expect(quote.goldAmount).toBe('0.11764705')
    expect(quote.unitPrice).toBe('8500000')
    // کارمزد پیش‌فرض ۰٫۵٪ = 5000
    expect(quote.fee).toBe('5000')
    // کل پرداختی = 1,000,000 + 5,000
    expect(quote.finalToman).toBe('1005000')
    expect(quote.minOrderToman).toBeTruthy()
  })

  it('خرید به گرم — تومان = مقدار × قیمت خرید', async () => {
    const ctx = { userId, kycLevel: 'LEVEL_3' as const }
    const quote = await getTradeQuote(ctx, { side: 'BUY', inputType: 'GOLD', amount: '0.1' })

    // 0.1 × 8,500,000 = 850,000
    expect(quote.tomanAmount).toBe('850000')
    expect(quote.goldAmount).toBe('0.1')
  })

  it('فروش — خالص دریافتی = ناخالص − کارمزد و موجودی در پاسخ', async () => {
    await buyGold({ userId, kycLevel: 'LEVEL_3' }, { tomanAmount: 10_000_000n })
    const ctx = { userId, kycLevel: 'LEVEL_3' as const }
    const quote = await getTradeQuote(ctx, { side: 'SELL', inputType: 'GOLD', amount: '0.5' })

    const gross = BigInt(quote.tomanAmount)
    const fee = BigInt(quote.fee)
    expect(BigInt(quote.finalToman)).toBe(gross - fee)
    expect(quote.unitPrice).toBe('8450000')
    // موجودی طلای پاسخ ≥ 0.5
    expect(Number(quote.balances.goldAvailable)).toBeGreaterThanOrEqual(0.5)
  })

  it('سازگاری پیش‌نمایش با اجرای واقعی — مقدار طلای خرید یکسان', async () => {
    const ctx = { userId, kycLevel: 'LEVEL_3' as const }

    const quote = await getTradeQuote(ctx, { side: 'BUY', inputType: 'TOMAN', amount: '2000000' })
    const order = await buyGold(ctx, { tomanAmount: 2_000_000n })

    // پیش‌نمایش با قیمت همان لحظه — مقدار طلا باید برابر اجرای واقعی باشد
    expect(order.goldAmount).toBe(quote.goldAmount)
  })

  it('سقف روزانه LEVEL_1 — limit و remaining درست گزارش می‌شود', async () => {
    const suffix = Date.now().toString().slice(-8)
    const u = await prisma.user.create({
      data: {
        mobile: `0916${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}F`,
        kycLevel: 'LEVEL_1',
      },
    })
    await ensureWallet(prisma, u.id)
    try {
      const quote = await getTradeQuote(
        { userId: u.id, kycLevel: 'LEVEL_1' },
        { side: 'BUY', inputType: 'TOMAN', amount: '100000' },
      )
      expect(quote.dailyLimit.limitToman).toBe('5000000')
      expect(quote.dailyLimit.usedToday).toBe('0')
      expect(quote.dailyLimit.remainingToman).toBe('5000000')
    } finally {
      const wallets = await prisma.wallet.findMany({ where: { userId: u.id } })
      await prisma.assetAccount.deleteMany({
        where: { walletId: { in: wallets.map((w) => w.id) } },
      })
      await prisma.wallet.deleteMany({ where: { userId: u.id } })
      await prisma.user.delete({ where: { id: u.id } })
    }
  })

  it('ورودی نامعتبر — خطا پرتاب می‌شود', async () => {
    const ctx = { userId, kycLevel: 'LEVEL_3' as const }
    await expect(
      getTradeQuote(ctx, { side: 'BUY', inputType: 'TOMAN', amount: '-5' }),
    ).rejects.toThrow()
    await expect(
      getTradeQuote(ctx, { side: 'SELL', inputType: 'GOLD', amount: 'abc' }),
    ).rejects.toThrow()
  })
})
