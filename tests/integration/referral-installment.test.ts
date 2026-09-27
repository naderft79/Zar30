// ============================================
// Zar30 - Referral & Installment Integration Test
// ============================================
// سناریوهای حیاتی روی PostgreSQL واقعی:
//   Referral: رکورد PENDING → QUALIFIED بعد از خرید → پاداش REWARDED با
//   سند متوازن → پاداش دوباره رد می‌شود (double-pay)
//   Installment: quote → درخواست → approve (وصول پیش‌پرداخت + تحویل طلا +
//   جدول اقساط) → پرداخت قسط → پرداخت دوباره رد می‌شود
// پیش نیاز: docker compose up -d && prisma migrate deploy && db:seed
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '../../src/lib/finance/money'
import { ensureWallet, ensureAssetAccount } from '../../src/lib/finance/wallet.service'
import { buyGold } from '../../src/lib/finance/order.service'
import {
  ensureReferralRecord,
  qualifyReferralOnBuy,
  payReferralReward,
} from '../../src/lib/services/referral.service'
import {
  quoteInstallment,
  requestInstallmentContract,
  approveInstallmentContract,
  payInstallment,
  getUserContract,
} from '../../src/lib/services/installment.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function cleanupUser(userId: string) {
  const wallets = await prisma.wallet.findMany({ where: { userId } })
  const wIds = wallets.map((w) => w.id)
  const accts = await prisma.assetAccount.findMany({ where: { walletId: { in: wIds } } })
  const acctIds = accts.map((a) => a.id)
  const entries = await prisma.ledgerEntry.findMany({
    where: { assetAccountId: { in: acctIds } },
    select: { journalEntryId: true },
  })
  const jIds = [...new Set(entries.map((e) => e.journalEntryId))]

  await prisma.installmentPayment.deleteMany({
    where: { contract: { userId } },
  })
  await prisma.installmentContract.deleteMany({ where: { userId } })
  await prisma.referral.deleteMany({
    where: { OR: [{ referrerId: userId }, { referredId: userId }] },
  })
  await prisma.transaction.deleteMany({ where: { userId } })
  await prisma.order.deleteMany({ where: { userId } })
  await prisma.notification.deleteMany({ where: { userId } })
  await prisma.auditLog.deleteMany({ where: { targetUserId: userId } })
  if (jIds.length > 0) {
    await prisma.ledgerEntry.deleteMany({ where: { journalEntryId: { in: jIds } } })
    await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } })
  }
  await prisma.assetAccount.deleteMany({ where: { walletId: { in: wIds } } })
  await prisma.wallet.deleteMany({ where: { userId } })
  await prisma.user.deleteMany({ where: { id: userId } })
}

// ادمین واقعی برای FK — approvedBy به admin_users (via user) رفرنس دارد
async function ensureTestAdmin(): Promise<string> {
  const suffix = Date.now().toString().slice(-9)
  const user = await prisma.user.create({
    data: {
      mobile: `0916${suffix.slice(0, 8)}`,
      passwordHash: 'test',
      referralCode: `TA${suffix.slice(0, 6)}`,
    },
  })
  const admin = await prisma.adminUser.create({
    data: { userId: user.id, role: 'OPERATIONS', permissions: [] },
  })
  return admin.id
}

let testAdminId = ''

async function makeUser(prefix: string) {
  const suffix = Date.now().toString().slice(-9) + Math.floor(Math.random() * 100)
  const u = await prisma.user.create({
    data: {
      mobile: `0914${suffix.slice(0, 8)}`,
      passwordHash: 'test',
      referralCode: `${prefix}${suffix.slice(0, 6)}`,
      kycLevel: 'LEVEL_3',
    },
  })
  await cleanupUser(u.id) // پاک‌سازی احتمالی قبلی
  const user = await prisma.user.create({
    data: {
      mobile: `0914${suffix.slice(0, 8)}`,
      passwordHash: 'test',
      referralCode: `${prefix}${suffix.slice(0, 6)}`,
      kycLevel: 'LEVEL_3',
    },
  })
  await ensureWallet(prisma, user.id)
  return user
}

// قیمت معتبر برای engine — همیشه یک قیمت تازه seed می‌شود
// (تست‌های دیگر ممکن است قیمت آینده‌نگر/abnormal گذاشته باشند)
async function ensurePrice() {
  const buyPrice = 7_500_000n
  const { recordPrice } = await import('../../src/lib/finance/pricing.service')
  await recordPrice({
    buyPrice,
    sellPrice: buyPrice - 50_000n,
    source: 'test-suite',
    allowAbnormal: true, // عبور از محافظ جهش — baseline این suite
  })
}

async function creditToman(userId: string, amount: bigint) {
  const { creditDepositCore } = await import('../../src/lib/finance/deposit.service')
  await prisma.$transaction(async (tx) => {
    const { ensureWallet } = await import('../../src/lib/finance/wallet.service')
    const wallet = await ensureWallet(tx, userId)
    const t = await tx.transaction.create({
      data: { walletId: wallet.id, userId, type: 'DEPOSIT', amount, status: 'PENDING' },
    })
    await creditDepositCore(tx, t.id)
  })
}

describe('Referral (Real PostgreSQL)', () => {
  let referrerId: string
  let referredId: string

  beforeAll(async () => {
    const referrer = await makeUser('T1')
    const referred = await makeUser('T2')
    referrerId = referrer.id
    referredId = referred.id
    await prisma.user.update({
      where: { id: referredId },
      data: { referredById: referrerId },
    })
    await ensurePrice()
    // خریدهای کاربر دعوت‌شده — اعتبار اولیه
    await creditToman(referredId, 5_000_000n)
  })

  afterAll(async () => {
    await cleanupUser(referredId)
    await cleanupUser(referrerId)
    await prisma.goldPrice.deleteMany({ where: { source: 'test-suite' } })
    await prisma.$disconnect()
  })

  it('ثبت‌نام با کد → رکورد PENDING ساخته می‌شود (idempotent)', async () => {
    await ensureReferralRecord(referredId)
    await ensureReferralRecord(referredId) // دوباره — رکورد اضافه نمی‌سازد
    const row = await prisma.referral.findUnique({ where: { referredId } })
    expect(row).not.toBeNull()
    expect(row!.status).toBe('PENDING')
    expect(row!.referrerId).toBe(referrerId)
  })

  it('خرید کم → هنوز qualified نمی‌شود؛ مجموع خرید ≥ حداقل → QUALIFIED', async () => {
    await buyGold({ userId: referredId, kycLevel: 'LEVEL_3' }, { tomanAmount: 500_000n })
    await qualifyReferralOnBuy(referredId, 500_000n)
    let row = await prisma.referral.findUnique({ where: { referredId } })
    expect(row!.status).toBe('PENDING') // زیر حداقل

    await buyGold({ userId: referredId, kycLevel: 'LEVEL_3' }, { tomanAmount: 600_000n })
    await qualifyReferralOnBuy(referredId, 600_000n)
    row = await prisma.referral.findUnique({ where: { referredId } })
    expect(row!.status).toBe('QUALIFIED')
    expect(row!.qualifiedAt).not.toBeNull()
  })

  it('پاداش → REWARDED با سند متوازن + موجودی معرف؛ دوباره رد می‌شود', async () => {
    const before = new Decimal((await ensureAssetAccount(prisma, referrerId, 'TOMAN')).balance)

    const res = await payReferralReward(
      { adminId: 'test-admin' },
      (await prisma.referral.findUniqueOrThrow({ where: { referredId } })).id,
    )
    expect(BigInt(res.rewardAmount) > 0n).toBe(true)

    const after = new Decimal((await ensureAssetAccount(prisma, referrerId, 'TOMAN')).balance)
    expect(after.sub(before).toString()).toBe(res.rewardAmount)

    // سند متوازن
    const row = await prisma.referral.findUniqueOrThrow({ where: { referredId } })
    expect(row.status).toBe('REWARDED')
    const journal = await prisma.journalEntry.findFirst({
      where: { referenceType: 'REFERRAL_REWARD', referenceId: row.id },
      include: { ledgerEntries: true },
    })
    expect(journal).not.toBeNull()
    const sum = journal!.ledgerEntries.reduce(
      (acc: Decimal, e) =>
        acc.add(
          e.entryType === 'DEBIT'
            ? new Decimal(e.amountToman?.toString() ?? '0')
            : new Decimal(e.amountToman?.toString() ?? '0').neg(),
        ),
      new Decimal(0),
    )
    expect(sum.toString()).toBe('0')

    // double-pay رد می‌شود
    await expect(payReferralReward({ adminId: 'test-admin' }, row.id)).rejects.toThrow()
  })
})

describe('Installment (Real PostgreSQL)', () => {
  let userId: string
  let planId: string
  const PRINCIPAL = 20_000_000n

  beforeAll(async () => {
    testAdminId = await ensureTestAdmin()
    const u = await makeUser('T3')
    userId = u.id
    await ensurePrice()
    // بدون اعتبار اولیه — هر تست وضعیت کیف پول خودش را می‌سازد

    const plan = await prisma.installmentPlan.create({
      data: {
        name: 'تست ۱۲ ماهه',
        months: 12,
        downPaymentPercent: 20,
        interestRate: 23,
        fee: 2,
        minAmount: 10_000_000n,
        maxAmount: 50_000_000n,
      },
    })
    planId = plan.id
  })

  afterAll(async () => {
    await cleanupUser(userId)
    await prisma.installmentPlan.deleteMany({ where: { id: planId } })
    await prisma.goldPrice.deleteMany({ where: { source: 'test-suite' } })
    await prisma.$disconnect()
  })

  it('quote — پیش‌پرداخت ۲۰٪ + قسط annuity + totalPayable صحیح', async () => {
    const q = await quoteInstallment({ planId, principal: PRINCIPAL })
    expect(BigInt(q.downPayment)).toBe(4_000_000n) // ۲۰٪
    expect(q.months).toBe(12)
    // اقساط باید بین صفر و مجموع کل باشد و totalPayable = down + Σ اقساط
    const down = BigInt(q.downPayment)
    const inst = BigInt(q.installment)
    expect(BigInt(q.totalPayable)).toBe(down + inst * 12n)
    expect(inst > 0n).toBe(true)
  })

  it('درخواست قرارداد بدون پیش‌پرداخت کافی → approve رد می‌شود (بدون تحویل طلا)', async () => {
    const contract = await requestInstallmentContract(
      { userId, kycLevel: 'LEVEL_3' },
      { planId, principal: PRINCIPAL, method: 'INTERNAL_CREDIT' },
    )
    await expect(
      approveInstallmentContract({ adminId: testAdminId }, contract.id),
    ).rejects.toThrow()

    const c = await prisma.installmentContract.findUniqueOrThrow({ where: { id: contract.id } })
    expect(c.status).toBe('PENDING') // دست‌نخورده — هیچ اثر مالی
  })

  it('با کیف پر → approve: وصول پیش‌پرداخت + طلا + ۱۲ قسط', async () => {
    await creditToman(userId, 20_000_000n) // پیش‌پرداخت ۴M + حاشیه کافی برای اقساط

    const contract = await requestInstallmentContract(
      { userId, kycLevel: 'LEVEL_3' },
      { planId, principal: PRINCIPAL, method: 'INTERNAL_CREDIT' },
    )
    const res = await approveInstallmentContract({ adminId: testAdminId }, contract.id)
    expect(res.status).toBe('ACTIVE')

    const detail = await getUserContract(userId, contract.id)
    expect(detail.payments.length).toBe(12)
    expect(detail.payments.every((p) => p.status === 'PENDING')).toBe(true)

    // پیش‌پرداخت کسر شده (۲۰M − ۴M = ۱۶M)
    const toman = new Decimal((await ensureAssetAccount(prisma, userId, 'TOMAN')).balance)
    expect(toman.toString()).toBe('16000000')
    // طلا تحویل شده
    const gold = new Decimal((await ensureAssetAccount(prisma, userId, 'GOLD')).balance)
    expect(gold.gt(0)).toBe(true)
  })

  it('پرداخت قسط → PAID با سند؛ پرداخت دوباره همان قسط رد می‌شود', async () => {
    const active = await prisma.installmentContract.findFirstOrThrow({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
    const detail = await getUserContract(userId, active.id)
    const contractId = detail.id
    const first = detail.payments[0]!
    const before = new Decimal((await ensureAssetAccount(prisma, userId, 'TOMAN')).balance)

    const res = await payInstallment({ userId, kycLevel: 'LEVEL_3' }, contractId, first.number)
    expect(res.status).toBe('PAID')

    const after = new Decimal((await ensureAssetAccount(prisma, userId, 'TOMAN')).balance)
    expect(before.sub(after).toString()).toBe(first.amount)

    await expect(
      payInstallment({ userId, kycLevel: 'LEVEL_3' }, contractId, first.number),
    ).rejects.toThrow()

    // قرارداد هنوز COMPLETED نیست
    const c = await prisma.installmentContract.findUniqueOrThrow({ where: { id: contractId } })
    expect(c.status).toBe('ACTIVE')
  })
})
