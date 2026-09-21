// ============================================
// Zar30 - Financial Core Integration Test
// ============================================
// تست‌های حیاتی روی PostgreSQL واقعی:
//   خرید → debit/credit صحیح + موجودی | فروش | idempotency
//   debit همزمان (race) | برداشت دوبار پردازش نمی‌شود | تراز سند
//   دسترسی کاربر دیگر ممنوع | reversal سند جبرانی می‌سازد
// پیش نیاز: docker compose up -d && prisma migrate deploy && db:seed
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '../../src/lib/finance/money'
import { ensureWallet, ensureAssetAccount } from '../../src/lib/finance/wallet.service'
import { postJournal } from '../../src/lib/finance/ledger.service'
import { buyGold, sellGold, getUserOrder } from '../../src/lib/finance/order.service'
import {
  requestWithdrawal,
  approveWithdrawal,
  payWithdrawal,
  rejectWithdrawal,
} from '../../src/lib/finance/withdrawal.service'
import { requestDeposit, creditDeposit } from '../../src/lib/finance/deposit.service'
import { reverseJournalEntry } from '../../src/lib/finance/reversal.service'
import { recordPrice } from '../../src/lib/finance/pricing.service'
import { reconcileAssetAccounts } from '../../src/lib/finance/reconciliation.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

let ADMIN = { adminId: '', adminRole: 'SUPER_ADMIN' }
const AUDIT = {}
const IBAN = 'IR062960000000100324200001'
const PRICE_BUY = 8_500_000n
const PRICE_SELL = 8_450_000n
const FEE_BPS = 50n // پیش‌فرض ۰٫۵٪

async function fundUser(userId: string, amount: bigint) {
  // واریز واقعی از مسیر سرویس — اعتبار مستقیم balance ممنوع است
  const dep = await requestDeposit({ userId, kycLevel: 'LEVEL_3' }, { amount })
  await creditDeposit(ADMIN, dep.id, AUDIT)
}

async function rialOf(userId: string) {
  const acct = await ensureAssetAccount(prisma, userId, 'RIAL')
  return { balance: new Decimal(acct.balance), locked: new Decimal(acct.lockedBalance) }
}

async function goldOf(userId: string) {
  const acct = await ensureAssetAccount(prisma, userId, 'GOLD')
  return { balance: new Decimal(acct.balance), locked: new Decimal(acct.lockedBalance) }
}

describe('Financial Core (Real PostgreSQL)', () => {
  let userId: string
  let otherUserId: string
  let adminUserId: string

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0911${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}A`,
        kycLevel: 'LEVEL_3',
      },
    })
    const o = await prisma.user.create({
      data: {
        mobile: `0912${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}B`,
        kycLevel: 'LEVEL_3',
      },
    })
    userId = u.id
    otherUserId = o.id
    await ensureWallet(prisma, userId)
    await ensureWallet(prisma, otherUserId)

    // ادمین واقعی — processedBy FK به admin_users اشاره می‌کند
    const adminUser = await prisma.user.create({
      data: {
        mobile: `0913${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}C`,
        kycLevel: 'LEVEL_3',
      },
    })
    adminUserId = adminUser.id
    const admin = await prisma.adminUser.create({
      data: { userId: adminUser.id, role: 'SUPER_ADMIN', permissions: [] },
    })
    ADMIN = { adminId: admin.id, adminRole: 'SUPER_ADMIN' }

    // قیمت‌های junk آینده‌نگر (داده‌های قدیمی تست) پاک می‌شوند
    await prisma.goldPrice.deleteMany({ where: { recordedAt: { gt: new Date() } } })
    await recordPrice({ buyPrice: PRICE_BUY, sellPrice: PRICE_SELL, source: 'test' })
  })

  afterAll(async () => {
    // پاکسازی به ترتیب FK — اسناد ledger تست هم حذف می‌شوند تا تست idempotent بماند
    const allUsers = [userId, otherUserId, adminUserId].filter(Boolean)
    const wallets = await prisma.wallet.findMany({ where: { userId: { in: allUsers } } })
    const wIds = wallets.map((w) => w.id)
    const accts = await prisma.assetAccount.findMany({ where: { walletId: { in: wIds } } })
    const acctIds = accts.map((a) => a.id)
    // همه سندهایی که legی روی حساب‌های تست دارند
    const entries = await prisma.ledgerEntry.findMany({
      where: { assetAccountId: { in: acctIds } },
      select: { journalEntryId: true },
    })
    const jIds = [...new Set(entries.map((e) => e.journalEntryId))]

    await prisma.transaction.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.withdrawalRequest.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.order.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.notification.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.idempotencyRecord.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.auditLog.deleteMany({ where: { targetUserId: { in: allUsers } } })
    await prisma.auditLog.deleteMany({ where: { actorId: ADMIN.adminId || 'none' } })
    if (jIds.length > 0) {
      await prisma.ledgerEntry.deleteMany({ where: { journalEntryId: { in: jIds } } })
      // اسناد برگشت (reversal_of خودارجاعی) قبل از اصل حذف می‌شوند
      await prisma.journalEntry.deleteMany({
        where: { id: { in: jIds }, reversalOf: { not: null } },
      })
      await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } })
    }
    await prisma.assetAccount.deleteMany({ where: { walletId: { in: wIds } } })
    await prisma.wallet.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.adminUser.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } })
    await prisma.$disconnect()
  })

  it('۱) واریز → خرید طلا → سند متوازن + موجودی صحیح', async () => {
    const deposit = 10_000_000n
    await fundUser(userId, deposit)

    const before = await rialOf(userId)
    expect(before.balance.toString()).toBe(deposit.toString())

    const buyRial = 4_250_000n // دقیقاً نیم گرم با قیمت ۸.۵م
    const order = await buyGold({ userId, kycLevel: 'LEVEL_3' }, { rialAmount: buyRial })
    const fee = (buyRial * FEE_BPS) / 10_000n
    const total = buyRial + fee

    expect(new Decimal(order.goldAmount).toString()).toBe('0.5')
    expect(order.status).toBe('FILLED')

    // موجودی‌ها
    const afterRial = await rialOf(userId)
    const afterGold = await goldOf(userId)
    expect(afterRial.balance.toString()).toBe((deposit - total).toString())
    expect(afterGold.balance.toString()).toBe('0.5')

    // سند متوازن
    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    const journal = await prisma.journalEntry.findUniqueOrThrow({
      where: { id: dbOrder.journalEntryId! },
      include: { ledgerEntries: true },
    })
    const dRial = journal.ledgerEntries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((s, e) => s + (e.amountRial ?? 0n), 0n)
    const cRial = journal.ledgerEntries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((s, e) => s + (e.amountRial ?? 0n), 0n)
    const dGold = journal.ledgerEntries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((s, e) => s.add(e.amountGold ?? 0), new Decimal(0))
    const cGold = journal.ledgerEntries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((s, e) => s.add(e.amountGold ?? 0), new Decimal(0))
    expect(dRial).toBe(cRial)
    expect(dGold.equals(cGold)).toBe(true)
  })

  it('۲) فروش طلا → ریال خالص (منهای کارمزد) به کیف پول می‌رسد', async () => {
    const before = await rialOf(userId)
    const goldBefore = await goldOf(userId)
    const sellGold0 = new Decimal('0.2')
    const order = await sellGold({ userId, kycLevel: 'LEVEL_3' }, { goldAmount: sellGold0 })
    const gross = goldBefore.balance.gt(0)
      ? sellGold0.mul(PRICE_SELL.toString()).toDecimalPlaces(0, Decimal.ROUND_FLOOR)
      : new Decimal(0)
    const grossB = BigInt(gross.toString())
    const fee = (grossB * FEE_BPS) / 10_000n
    const net = grossB - fee

    expect(order.type).toBe('SELL')
    expect(order.total).toBe(net.toString())

    const after = await rialOf(userId)
    const afterGold = await goldOf(userId)
    expect(after.balance.toString()).toBe(before.balance.add(net.toString()).toString())
    expect(afterGold.balance.toString()).toBe(goldBefore.balance.sub(sellGold0).toString())
  })

  it('۳) debit همزمان — یکی باید شکست بخورد، موجودی منفی هرگز', async () => {
    const current = await rialOf(userId)
    const big = current.balance // کل موجودی آزاد
    if (big.lte(0)) throw new Error('test setup: empty balance')

    // دو درخواست برداشت همزمان — مجموعاً بیشتر از موجودی
    const amount = BigInt(big.toDecimalPlaces(0, Decimal.ROUND_FLOOR).toString())
    const half = amount / 2n + 1n // کمی بیشتر از نصف — هر دو نمی‌توانند موفق شوند

    const results = await Promise.allSettled([
      requestWithdrawal({ userId, kycLevel: 'LEVEL_3' }, { amount: half, iban: IBAN }),
      requestWithdrawal({ userId, kycLevel: 'LEVEL_3' }, { amount: half, iban: IBAN }),
    ])

    const succeeded = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')
    // حداکثر یکی موفق — چون half*2 > موجودی آزاد
    expect(succeeded.length).toBeLessThanOrEqual(1)
    expect(failed.length).toBeGreaterThanOrEqual(1)

    const after = await rialOf(userId)
    // مدل موجودی: balance = آزاد، locked = مسدود — هر دو ≥ 0
    expect(after.balance.gte(0)).toBe(true)
    expect(after.locked.gte(0)).toBe(true)
  })

  it('۴) برداشت دوبار پردازش نمی‌شود — state machine enforce', async () => {
    // رد برداشت‌های قبلی برای آزادسازی قفل تست ۳
    const pendings = await prisma.withdrawalRequest.findMany({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
    })
    for (const p of pendings) {
      if (p.status === 'PENDING') {
        await rejectWithdrawal(ADMIN, p.id, 'cleanup', AUDIT)
      }
    }

    const current = await rialOf(userId)
    // balance = موجودی آزاد — مبلغ از همین محاسبه می‌شود
    const amount = BigInt(current.balance.toDecimalPlaces(0, Decimal.ROUND_FLOOR).toString())
    const w = await requestWithdrawal(
      { userId, kycLevel: 'LEVEL_3' },
      { amount: amount > 1_000_000n ? 1_000_000n : amount, iban: IBAN },
    )

    await approveWithdrawal(ADMIN, w.id, AUDIT)
    await payWithdrawal(ADMIN, w.id, AUDIT)

    // pay دوباره → خطا
    await expect(payWithdrawal(ADMIN, w.id, AUDIT)).rejects.toThrow()
    // approve دوباره → خطا
    await expect(approveWithdrawal(ADMIN, w.id, AUDIT)).rejects.toThrow()
  })

  it('۵) idempotency — رکورد COMPLETED درخواست دوباره را replay می‌کند', async () => {
    // اجرای مستقیم سرویس idempotency — رفتار replay تست می‌شود
    const { withIdempotency } = await import('../../src/lib/finance/idempotency')
    const key = `test_idem_${Date.now()}`
    const fakeReq = new Request('http://x', { headers: { 'Idempotency-Key': key } })

    let calls = 0
    const fn = async () => {
      calls++
      return { marker: 'ok' }
    }

    const first = await withIdempotency(
      { req: fakeReq, userId, endpoint: 'test.ep', body: { a: 1 } },
      fn,
    )
    const second = await withIdempotency(
      { req: fakeReq, userId, endpoint: 'test.ep', body: { a: 1 } },
      fn,
    )

    expect(first.replayed).toBe(false)
    expect(second.replayed).toBe(true)
    expect(calls).toBe(1) // fn فقط یک بار اجرا شد
    expect(second.data).toEqual({ marker: 'ok' })

    // همان key با بدنه متفاوت → conflict
    await expect(
      withIdempotency({ req: fakeReq, userId, endpoint: 'test.ep', body: { a: 2 } }, fn),
    ).rejects.toThrow()
  })

  it('۶) سند نامتوازن → postJournal رد می‌کند و هیچ اثری نمی‌ماند', async () => {
    const rial = await ensureAssetAccount(prisma, userId, 'RIAL')
    const before = await rialOf(userId)

    await expect(
      prisma.$transaction(async (tx) => {
        await postJournal(tx, {
          description: 'TEST_imbalanced',
          legs: [
            {
              account: 'ASSET_RIAL',
              side: 'DEBIT',
              amountRial: 1000n,
              assetAccountId: rial.id,
            },
            { account: 'LIABILITY_USER_RIAL', side: 'CREDIT', amountRial: 999n },
          ],
        })
      }),
    ).rejects.toThrow()

    const after = await rialOf(userId)
    expect(after.balance.toString()).toBe(before.balance.toString())
  })

  it('۷) کاربر دیگر به سفارش من دسترسی ندارد', async () => {
    const myOrder = await prisma.order.findFirstOrThrow({ where: { userId } })
    await expect(getUserOrder(otherUserId, myOrder.id)).rejects.toThrow()
  })

  it('۸) reversal — سند جبرانی، موجودی برمی‌گردد، history حفظ می‌شود', async () => {
    const order = await prisma.order.findFirstOrThrow({
      where: { userId, status: 'FILLED', type: 'SELL' },
      orderBy: { createdAt: 'desc' },
    })
    const journalId = order.journalEntryId!

    const rialBefore = await rialOf(userId)
    const goldBefore = await goldOf(userId)

    const result = await reverseJournalEntry(ADMIN, journalId, 'test reversal', AUDIT)
    expect(result.reversalId).toBeTruthy()

    // سند اصلی REVERSED شد ولی حذف نشد
    const original = await prisma.journalEntry.findUniqueOrThrow({ where: { id: journalId } })
    expect(original.status).toBe('REVERSED')

    // سند جبرانی وجود دارد و به اصلی لینک است
    const reversal = await prisma.journalEntry.findUniqueOrThrow({
      where: { id: result.reversalId },
      include: { ledgerEntries: true },
    })
    expect(reversal.reversalOf).toBe(journalId)

    // موجودی‌ها به حالت قبل از sell برگشتند (sell: +rial −gold → reversal: −rial +gold)
    const rialAfter = await rialOf(userId)
    const goldAfter = await goldOf(userId)
    const net = BigInt(order.total)
    expect(rialAfter.balance.toString()).toBe(rialBefore.balance.sub(net.toString()).toString())
    expect(goldAfter.balance.toString()).toBe(
      goldBefore.balance.add(order.goldAmount.toString()).toString(),
    )

    // سفارش به REVERSED رفت
    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updatedOrder.status).toBe('REVERSED')

    // برگشت دوباره → خطا (سند اصلی دیگر POSTED نیست)
    await expect(reverseJournalEntry(ADMIN, journalId, 'again', AUDIT)).rejects.toThrow()
  })

  it('۹) تطبیق — موجودی حساب‌های تست با دفتر کل سازگار است', async () => {
    // reconcile صفحه اول — حساب‌های تست ما ممکن است در صفحه اول نباشند؛
    // برای دقت مستقیم روی ledger محاسبه می‌کنیم
    const rial = await ensureAssetAccount(prisma, userId, 'RIAL')
    const rows = await prisma.ledgerEntry.findMany({
      where: { assetAccountId: rial.id },
      include: { ledgerAccount: { select: { code: true } } },
    })
    let expected = new Decimal(0)
    let expectedLocked = new Decimal(0)
    for (const e of rows) {
      const amt = new Decimal((e.amountRial ?? 0n).toString())
      const signed = e.entryType === 'DEBIT' ? amt : amt.neg()
      if (e.ledgerAccount.code === 'ASSET_RIAL') expected = expected.add(signed)
      if (e.ledgerAccount.code === 'ASSET_LOCKED_RIAL') expectedLocked = expectedLocked.add(signed)
    }
    const acct = await prisma.assetAccount.findUniqueOrThrow({ where: { id: rial.id } })
    expect(new Decimal(acct.balance).toString()).toBe(expected.toString())
    expect(new Decimal(acct.lockedBalance).toString()).toBe(expectedLocked.toString())

    // smoke test سرویس تطبیق — خروجی ساختاریافته برمی‌گردد
    const report = await reconcileAssetAccounts(1, 5)
    expect(Array.isArray(report.items)).toBe(true)
  })
})
