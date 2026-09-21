// ============================================
// Zar30 - Payment Gateway Integration Test
// ============================================
// تست‌های حیاتی درگاه روی PostgreSQL واقعی + SandboxGateway:
//   create → callback موفق → credit | callback تکراری (replay)
//   amount mismatch | لغو کاربر | انقضا
// پیش نیاز: docker compose up -d && prisma migrate deploy && db:seed
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '../../src/lib/finance/money'
import { ensureWallet, ensureAssetAccount } from '../../src/lib/finance/wallet.service'
import { createDepositPayment, handleGatewayCallback } from '../../src/lib/payment/payment.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const AMOUNT = 100_000n // تومان

async function tomanBalance(userId: string) {
  const acct = await ensureAssetAccount(prisma, userId, 'TOMAN')
  return new Decimal(acct.balance)
}

// ساخت جلسه پرداخت واقعی از مسیر سرویس
async function newPayment(userId: string, amount = AMOUNT) {
  const p = await createDepositPayment({ userId, kycLevel: 'LEVEL_3' }, { amount })
  expect(p.authority.startsWith('SBX-')).toBe(true)
  return p
}

describe('Payment Gateway (Real PostgreSQL + Sandbox)', () => {
  let userId: string

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0914${suffix}`,
        passwordHash: 'test',
        referralCode: `T${suffix}P`,
        kycLevel: 'LEVEL_3',
      },
    })
    userId = u.id
    await ensureWallet(prisma, userId)
  })

  afterAll(async () => {
    const wallets = await prisma.wallet.findMany({ where: { userId } })
    const wIds = wallets.map((w) => w.id)
    const accts = await prisma.assetAccount.findMany({ where: { walletId: { in: wIds } } })
    const acctIds = accts.map((a) => a.id)
    const entries = await prisma.ledgerEntry.findMany({
      where: { assetAccountId: { in: acctIds } },
      select: { journalEntryId: true },
    })
    const jIds = [...new Set(entries.map((e) => e.journalEntryId))]

    await prisma.payment.deleteMany({ where: { userId } })
    await prisma.transaction.deleteMany({ where: { userId } })
    await prisma.notification.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({ where: { targetUserId: userId } })
    await prisma.auditLog.deleteMany({ where: { actorId: 'gateway:sandbox' } })
    if (jIds.length > 0) {
      await prisma.ledgerEntry.deleteMany({ where: { journalEntryId: { in: jIds } } })
      await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } })
    }
    await prisma.assetAccount.deleteMany({ where: { walletId: { in: wIds } } })
    await prisma.wallet.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('۱) create → callback موفق → پرداخت PAID + واریز COMPLETED + موجودی شارژ', async () => {
    const before = await tomanBalance(userId)
    const p = await newPayment(userId)

    const result = await handleGatewayCallback({ authority: p.authority, status: 'OK' })
    expect(result.status).toBe('PAID')
    expect(result.replayed).toBe(false)
    expect(result.refId).toBeTruthy()

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: p.paymentId } })
    expect(payment.status).toBe('PAID')
    expect(payment.verifiedAt).not.toBeNull()

    const tx = await prisma.transaction.findUniqueOrThrow({
      where: { id: p.transactionId },
    })
    expect(tx.status).toBe('COMPLETED')
    expect(tx.journalEntryId).not.toBeNull()

    // سند متوازن
    const journal = await prisma.journalEntry.findUniqueOrThrow({
      where: { id: tx.journalEntryId! },
      include: { ledgerEntries: true },
    })
    const d = journal.ledgerEntries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((s, e) => s + (e.amountToman ?? 0n), 0n)
    const c = journal.ledgerEntries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((s, e) => s + (e.amountToman ?? 0n), 0n)
    expect(d).toBe(c)
    expect(d).toBe(AMOUNT)

    const after = await tomanBalance(userId)
    expect(after.sub(before).toString()).toBe(AMOUNT.toString())
  })

  it('۲) callback تکراری → replayed و بدون credit دوباره', async () => {
    const before = await tomanBalance(userId)
    const p = await newPayment(userId)

    const first = await handleGatewayCallback({ authority: p.authority, status: 'OK' })
    const second = await handleGatewayCallback({ authority: p.authority, status: 'OK' })
    const third = await handleGatewayCallback({ authority: p.authority, status: 'OK' })

    expect(first.replayed).toBe(false)
    expect(second.replayed).toBe(true)
    expect(third.replayed).toBe(true)
    expect(second.status).toBe('PAID')

    const after = await tomanBalance(userId)
    expect(after.sub(before).toString()).toBe(AMOUNT.toString()) // فقط یک بار
  })

  it('۳) amount mismatch → پرداخت FAILED و هیچ creditای انجام نمی‌شود', async () => {
    const before = await tomanBalance(userId)
    const p = await newPayment(userId)

    // درگاه sandbox با authority پایانی -MISMATCH مبلغ متفاوت برمی‌گرداند
    await prisma.payment.update({
      where: { id: p.paymentId },
      data: { authority: `${p.authority}-MISMATCH` },
    })

    await expect(
      handleGatewayCallback({ authority: `${p.authority}-MISMATCH`, status: 'OK' }),
    ).rejects.toThrow()

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: p.paymentId } })
    expect(payment.status).toBe('FAILED')
    expect(payment.failureReason).toContain('amount_mismatch')

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: p.transactionId } })
    expect(tx.status).toBe('PENDING') // credit نشده

    const after = await tomanBalance(userId)
    expect(after.sub(before).toString()).toBe('0')
  })

  it('۴) لغو توسط کاربر → CANCELLED و بدون credit', async () => {
    const before = await tomanBalance(userId)
    const p = await newPayment(userId)

    const result = await handleGatewayCallback({ authority: p.authority, status: 'NOK' })
    expect(result.status).toBe('CANCELLED')

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: p.transactionId } })
    expect(tx.status).toBe('PENDING')
    const after = await tomanBalance(userId)
    expect(after.sub(before).toString()).toBe('0')
  })

  it('۵) پرداخت منقضی → EXPIRED و قابل verify نیست', async () => {
    const p = await newPayment(userId)
    await prisma.payment.update({
      where: { id: p.paymentId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })

    const result = await handleGatewayCallback({ authority: p.authority, status: 'OK' })
    expect(result.status).toBe('EXPIRED')

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: p.transactionId } })
    expect(tx.status).toBe('PENDING')
  })

  it('۶) authority ناموجود → خطا', async () => {
    await expect(
      handleGatewayCallback({ authority: 'SBX-NONEXISTENT', status: 'OK' }),
    ).rejects.toThrow()
  })
})
