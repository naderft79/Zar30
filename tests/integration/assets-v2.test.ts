// ============================================
// Zar30 - Assets v2 Services Integration Test
// ============================================
// پوشش سرویس‌های مالی Assets v2 روی PostgreSQL واقعی:
//   انتقال داخلی (تومان/طلا/هدیه + سقف LimitRule)
//   تحویل فیزیکی (قفل/آزادسازی/تسویه طلا + lifecycle ادمین)
//   خرید خودکار SIP | سپرده زرکار | تبدیل سکه | هشدار قیمت
//   دفترچه آدرس | حساب بانکی | خلاصه مالی
// پیش نیاز: docker compose up -d && prisma migrate deploy && db:seed
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '../../src/lib/finance/money'
import { ensureWallet, ensureAssetAccount } from '../../src/lib/finance/wallet.service'
import { buyGold } from '../../src/lib/finance/order.service'
import { requestDeposit, creditDeposit } from '../../src/lib/finance/deposit.service'
import { recordPrice } from '../../src/lib/finance/pricing.service'
import {
  resolveRecipient,
  createTransfer,
  listUserTransfers,
} from '../../src/lib/finance/transfer.service'
import {
  getDeliveryConfig,
  setDeliveryConfig,
  createDeliveryRequest,
  cancelDeliveryRequest,
  approveDelivery,
  prepareDelivery,
  shipDelivery,
  deliverDelivery,
  rejectDelivery,
} from '../../src/lib/finance/delivery.service'
import {
  createSavingsPlan,
  setSavingsPlanActive,
  deleteSavingsPlan,
  runDueSavingsPlans,
} from '../../src/lib/finance/sip.service'
import {
  listZarkarPlans,
  subscribeZarkar,
  processZarkarPayouts,
  listUserPositions,
} from '../../src/lib/finance/zarkar.service'
import {
  listCoinProducts,
  convertToCoin,
  listUserCoinHoldings,
} from '../../src/lib/finance/coin.service'
import {
  createPriceAlert,
  listPriceAlerts,
  deletePriceAlert,
  checkPriceAlerts,
} from '../../src/lib/finance/price-alert.service'
import { enforceLimit } from '../../src/lib/finance/limit.service'
import {
  createAddress,
  listAddresses,
  setDefaultAddress,
  deleteAddress,
} from '../../src/lib/finance/address.service'
import {
  createBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
  getOwnedIban,
} from '../../src/lib/finance/bank-account.service'
import { getFinancialSummary } from '../../src/lib/finance/summary.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

let ADMIN = { adminId: '', adminRole: 'SUPER_ADMIN' }
const AUDIT = {}
// کد بانک = ارقام ۴ تا ۷ شبا → 010=ملی، 012=ملت
const IBAN = 'IR060100000000100324200001'
const IBAN2 = 'IR120120000000100324200001'
const PRICE_BUY = 8_500_000n
const PRICE_SELL = 8_450_000n

async function fundUser(userId: string, amount: bigint) {
  const dep = await requestDeposit({ userId, kycLevel: 'LEVEL_3' }, { amount })
  await creditDeposit(ADMIN, dep.id, AUDIT)
}

async function tomanOf(userId: string) {
  const acct = await ensureAssetAccount(prisma, userId, 'TOMAN')
  return { balance: new Decimal(acct.balance), locked: new Decimal(acct.lockedBalance) }
}

async function goldOf(userId: string) {
  const acct = await ensureAssetAccount(prisma, userId, 'GOLD')
  return { balance: new Decimal(acct.balance), locked: new Decimal(acct.lockedBalance) }
}

// شارژ کیف طلای کاربر از مسیر واقعی خرید
async function fundGold(userId: string, tomanAmount: bigint) {
  await fundUser(userId, tomanAmount)
  await buyGold({ userId, kycLevel: 'LEVEL_3' }, { tomanAmount })
}

describe('Assets v2 Services (Real PostgreSQL)', () => {
  let userId: string
  let otherUserId: string
  let adminUserId: string
  let planId: string
  let coinProductId: string
  let deliveryConfigSnapshot: string | null = null

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0921${suffix}`,
        passwordHash: 'test',
        referralCode: `V${suffix}A`,
        kycLevel: 'LEVEL_3',
      },
    })
    const o = await prisma.user.create({
      data: {
        mobile: `0922${suffix}`,
        passwordHash: 'test',
        referralCode: `V${suffix}B`,
        kycLevel: 'LEVEL_3',
      },
    })
    userId = u.id
    otherUserId = o.id
    await ensureWallet(prisma, userId)
    await ensureWallet(prisma, otherUserId)

    const adminUser = await prisma.user.create({
      data: {
        mobile: `0923${suffix}`,
        passwordHash: 'test',
        referralCode: `V${suffix}C`,
        kycLevel: 'LEVEL_3',
      },
    })
    adminUserId = adminUser.id
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

    // طرح زرکار و محصول سکه اختصاصی تست — وابسته به seed نیستند
    const plan = await prisma.investmentPlan.create({
      data: {
        name: 'TEST_ZARKAR_PLAN',
        durationDays: 60,
        minGoldGram: new Decimal('0.5'),
        interestRateType: 'FIXED',
        rate: new Decimal('6'),
      },
    })
    planId = plan.id

    const product = await prisma.coinProduct.create({
      data: {
        code: `TEST_COIN_${suffix}`,
        name: 'سکه تست',
        kind: 'COIN',
        weightGrams: new Decimal('1'),
        premiumToman: 100_000n,
      },
    })
    coinProductId = product.id

    // اسنادپشتیبان پیکربندی تحویل برای بازگردانی در afterAll
    const cfg = await prisma.platformSetting.findUnique({ where: { key: 'delivery.config' } })
    deliveryConfigSnapshot = cfg ? JSON.stringify(cfg.value) : null
  })

  afterAll(async () => {
    const allUsers = [userId, otherUserId, adminUserId].filter(Boolean)
    const wallets = await prisma.wallet.findMany({ where: { userId: { in: allUsers } } })
    const wIds = wallets.map((w) => w.id)
    const accts = await prisma.assetAccount.findMany({ where: { walletId: { in: wIds } } })
    const acctIds = accts.map((a) => a.id)
    const entries = await prisma.ledgerEntry.findMany({
      where: { assetAccountId: { in: acctIds } },
      select: { journalEntryId: true },
    })
    const jIds = [...new Set(entries.map((e) => e.journalEntryId))]

    // حذف به ترتیب FK — ابتدا اشیا وابسته، بعد اسناد، بعد کیف‌پول‌ها
    await prisma.interestPayout.deleteMany({
      where: { position: { userId: { in: allUsers } } },
    })
    await prisma.investmentPosition.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.investmentPlan.deleteMany({ where: { name: 'TEST_ZARKAR_PLAN' } })
    await prisma.coinHolding.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.coinProduct.deleteMany({ where: { id: coinProductId } })
    await prisma.recurringBuyPlan.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.priceAlert.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.goldDeliveryRequest.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.internalTransfer.deleteMany({ where: { senderId: { in: allUsers } } })
    await prisma.internalTransfer.deleteMany({ where: { recipientId: { in: allUsers } } })
    await prisma.address.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.bankAccount.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.limitRule.deleteMany({
      where: { scope: 'TRANSFER', amountToman: { lte: 100_000n } },
    })
    await prisma.transaction.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.withdrawalRequest.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.order.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.notification.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.idempotencyRecord.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.auditLog.deleteMany({ where: { targetUserId: { in: allUsers } } })
    await prisma.auditLog.deleteMany({ where: { actorId: ADMIN.adminId || 'none' } })
    if (jIds.length > 0) {
      await prisma.ledgerEntry.deleteMany({ where: { journalEntryId: { in: jIds } } })
      await prisma.journalEntry.deleteMany({
        where: { id: { in: jIds }, reversalOf: { not: null } },
      })
      await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } })
    }
    await prisma.assetAccount.deleteMany({ where: { walletId: { in: wIds } } })
    await prisma.wallet.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.adminUser.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } })

    // بازگردانی پیکربندی تحویل به حالت قبل از تست
    if (deliveryConfigSnapshot) {
      await prisma.platformSetting.update({
        where: { key: 'delivery.config' },
        data: { value: JSON.parse(deliveryConfigSnapshot) },
      })
    } else {
      await prisma.platformSetting.deleteMany({ where: { key: 'delivery.config' } })
    }
  })

  // ---------- Internal Transfer ----------

  it('resolveRecipient — موبایل ناموجود و خود-انتقال رد می‌شود', async () => {
    await expect(resolveRecipient('09999999999', userId)).rejects.toThrow()
    const self = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    await expect(resolveRecipient(self.mobile, userId)).rejects.toThrow()
  })

  it('انتقال تومان — journal متقارن و موجودی دو طرف دقیق', async () => {
    await fundUser(userId, 100_000n)
    const before = await tomanOf(userId)
    const beforeOther = await tomanOf(otherUserId)

    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: otherUserId } })
    const tr = await createTransfer(userId, {
      recipientMobile: recipient.mobile,
      assetType: 'TOMAN',
      tomanAmount: 40_000n,
      kind: 'TRANSFER',
    })

    // آبجکت برگشتی record اولیه است — journalEntryId بعداً ست می‌شود؛ از DB بخوان
    const stored = await prisma.internalTransfer.findUniqueOrThrow({ where: { id: tr.id } })
    expect(stored.journalEntryId).toBeTruthy()
    const after = await tomanOf(userId)
    const afterOther = await tomanOf(otherUserId)
    expect(before.balance.sub(after.balance).toFixed(0)).toBe('40000')
    expect(afterOther.balance.sub(beforeOther.balance).toFixed(0)).toBe('40000')

    // سند متوازن: دو leg روی ASSET_TOMAN
    const legs = await prisma.ledgerEntry.findMany({
      where: { journalEntryId: stored.journalEntryId! },
    })
    expect(legs).toHaveLength(2)
    const debits = legs.filter((l) => l.entryType === 'DEBIT')
    const credits = legs.filter((l) => l.entryType === 'CREDIT')
    expect(debits).toHaveLength(1)
    expect(credits).toHaveLength(1)
  })

  it('انتقال طلا به‌صورت هدیه — پیام ذخیره و موجودی طلای گیرنده زیاد می‌شود', async () => {
    await fundGold(userId, 9_000_000n)
    const goldBefore = await goldOf(otherUserId)
    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: otherUserId } })

    const tr = await createTransfer(userId, {
      recipientMobile: recipient.mobile,
      assetType: 'GOLD',
      goldAmount: '0.5',
      kind: 'GIFT',
      giftMessage: 'هدیه تولد',
    })

    expect(tr.giftMessage).toBe('هدیه تولد')
    const goldAfter = await goldOf(otherUserId)
    expect(goldAfter.balance.sub(goldBefore.balance).toString()).toBe('0.5')
  })

  it('انتقال — مبالغ نامعتبر و سقف LimitRule روزانه enforce می‌شود', async () => {
    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: otherUserId } })
    await expect(
      createTransfer(userId, {
        recipientMobile: recipient.mobile,
        assetType: 'TOMAN',
        tomanAmount: 0n,
        kind: 'TRANSFER',
      }),
    ).rejects.toThrow()

    // قانون سقف روزانه ۵۰هزار تومان برای انتقال
    const rule = await prisma.limitRule.create({
      data: { scope: 'TRANSFER', period: 'DAILY', amountToman: 50_000n },
    })
    await expect(
      createTransfer(userId, {
        recipientMobile: recipient.mobile,
        assetType: 'TOMAN',
        tomanAmount: 60_000n,
        kind: 'TRANSFER',
      }),
    ).rejects.toThrow()
    await prisma.limitRule.delete({ where: { id: rule.id } })
  })

  it('enforceLimit — بدون قانون فعال هیچ محدودیتی اعمال نمی‌شود', async () => {
    await expect(
      enforceLimit(userId, 'LEVEL_3', 'WITHDRAW', { toman: 999_999_999n }),
    ).resolves.toBeUndefined()
  })

  it('listUserTransfers — هر دو سمت انتقال را می‌بیند', async () => {
    const { items, total } = await listUserTransfers(otherUserId, 1, 20)
    expect(total).toBeGreaterThanOrEqual(2)
    expect(items[0]!.sender.mobile).toBeTruthy()
    expect(items[0]!.recipient.mobile).toBeTruthy()
  })

  // ---------- Gold Delivery ----------

  it('پیکربندی تحویل — set/get روی PlatformSetting', async () => {
    await setDeliveryConfig(ADMIN.adminId, {
      feePost: 50_000n,
      feePickup: 10_000n,
      minGrams: '0.1',
    })
    const cfg = await getDeliveryConfig()
    expect(cfg.feePost).toBe(50_000n)
    expect(cfg.minGrams).toBe('0.1')
  })

  it('ایجاد درخواست پستی بدون آدرس رد می‌شود؛ با آدرس → طلا قفل + هزینه کسر', async () => {
    await expect(createDeliveryRequest(userId, { grams: '1', method: 'POST' })).rejects.toThrow()

    const addr = await createAddress(userId, {
      recipientName: 'تست تحویل',
      mobile: '09120000000',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان تست',
      postalCode: '1234567890',
    })

    await fundUser(userId, 500_000n) // پوشش هزینه‌های تحویل
    const goldBefore = await goldOf(userId)
    const tomanBefore = await tomanOf(userId)
    const req = await createDeliveryRequest(userId, {
      grams: '0.2',
      method: 'POST',
      addressId: addr.id,
    })
    expect(req.status).toBe('PENDING')
    expect(req.feeToman).toBe(50_000n)

    const goldAfter = await goldOf(userId)
    const tomanAfter = await tomanOf(userId)
    expect(goldAfter.locked.sub(goldBefore.locked).toString()).toBe('0.2')
    expect(tomanBefore.balance.sub(tomanAfter.balance).toFixed(0)).toBe('50000')

    // لغو → آزادسازی قفل + برگشت هزینه
    await cancelDeliveryRequest(userId, req.id)
    const goldFinal = await goldOf(userId)
    const tomanFinal = await tomanOf(userId)
    expect(goldFinal.locked.toString()).toBe(goldBefore.locked.toString())
    expect(tomanFinal.balance.toFixed(0)).toBe(tomanBefore.balance.toFixed(0))
  })

  it('lifecycle کامل ادمین: PENDING→APPROVED→PREPARING→SHIPPED→DELIVERED و تسویه طلا', async () => {
    const req = await createDeliveryRequest(userId, { grams: '0.1', method: 'PICKUP' })
    // قفل موقت: locked +0.1 و balance -0.1
    const mid = await goldOf(userId)
    const pre = await prisma.goldDeliveryRequest.findUniqueOrThrow({ where: { id: req.id } })
    expect(pre.status).toBe('PENDING')

    await approveDelivery(ADMIN, req.id, 'تایید', AUDIT)
    await prepareDelivery(ADMIN, req.id, AUDIT)
    await shipDelivery(
      ADMIN,
      req.id,
      { pickupBranch: 'شعبه مرکزی', pickupAt: new Date(Date.now() + 86400_000) },
      AUDIT,
    )
    const done = await deliverDelivery(ADMIN, req.id, AUDIT)
    expect(done.status).toBe('DELIVERED')

    // تسویه از موجودی قفل‌شده: locked به baseline برمی‌گردد و balance دائماً -0.1 می‌شود
    const goldAfter = await goldOf(userId)
    expect(mid.locked.sub(goldAfter.locked).toString()).toBe('0.1')
    expect(mid.balance.sub(goldAfter.balance).toString()).toBe('0')

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'delivery', entityId: req.id },
    })
    expect(audits.length).toBeGreaterThanOrEqual(4)

    // transition نامعتبر — DELIVERED دیگر قابل تغییر نیست
    await expect(approveDelivery(ADMIN, req.id, undefined, AUDIT)).rejects.toThrow()
  })

  it('reject از PENDING — قفل آزاد + هزینه برگشت + وضعیت REJECTED', async () => {
    const before = await goldOf(userId)
    const req = await createDeliveryRequest(userId, { grams: '0.1', method: 'PICKUP' })
    const res = await rejectDelivery(ADMIN, req.id, 'مغایرت مدارک', AUDIT)
    expect(res.status).toBe('REJECTED')
    const goldAfter = await goldOf(userId)
    expect(goldAfter.locked.toString()).toBe(before.locked.toString())
  })

  // ---------- SIP (خرید خودکار) ----------

  it('پلن SIP — حداقل مبلغ enforce؛ ایجاد/تعلیق/حذف', async () => {
    await expect(
      createSavingsPlan(userId, { tomanAmount: 1_000n, frequency: 'DAILY' }),
    ).rejects.toThrow()

    const plan = await createSavingsPlan(userId, {
      tomanAmount: 50_000n,
      frequency: 'WEEKLY',
    })
    expect(plan.active).toBe(true)
    expect(plan.nextRunAt.getTime()).toBeGreaterThan(Date.now())

    const paused = await setSavingsPlanActive(userId, plan.id, false)
    expect(paused.active).toBe(false)

    // کاربر دیگر نمی‌تواند پلن را دستکاری کند
    await expect(setSavingsPlanActive(otherUserId, plan.id, true)).rejects.toThrow()
    await deleteSavingsPlan(userId, plan.id)
    expect(await prisma.recurringBuyPlan.findUnique({ where: { id: plan.id } })).toBeNull()
  })

  it('runDueSavingsPlans — پلن سررسیدشده خرید می‌کند و شکست شمارش می‌شود', async () => {
    const recipient = await prisma.user.findUniqueOrThrow({ where: { id: otherUserId } })

    // پلن سررسیدشده برای کاربر شارژشده → باید خرید موفق
    await fundUser(userId, 500_000n)
    const okPlan = await prisma.recurringBuyPlan.create({
      data: {
        userId,
        tomanAmount: 100_000n,
        frequency: 'DAILY',
        nextRunAt: new Date(Date.now() - 1000),
      },
    })
    // پلن سررسیدشده برای کاربر بدون موجودی (recipient) → باید شکست بخورد
    const failPlan = await prisma.recurringBuyPlan.create({
      data: {
        userId: recipient.id,
        tomanAmount: 100_000n,
        frequency: 'DAILY',
        nextRunAt: new Date(Date.now() - 1000),
      },
    })

    await runDueSavingsPlans()

    const okAfter = await prisma.recurringBuyPlan.findUniqueOrThrow({ where: { id: okPlan.id } })
    expect(okAfter.lastOrderId).toBeTruthy()
    expect(okAfter.consecutiveFailures).toBe(0)
    expect(okAfter.nextRunAt.getTime()).toBeGreaterThan(Date.now())

    const failAfter = await prisma.recurringBuyPlan.findUniqueOrThrow({
      where: { id: failPlan.id },
    })
    expect(failAfter.consecutiveFailures).toBe(1)
    expect(failAfter.lastError).toBeTruthy()
    expect(failAfter.active).toBe(true) // فقط ۱ شکست — هنوز فعال

    // سه شکست پیاپی → غیرفعال
    await prisma.recurringBuyPlan.update({
      where: { id: failPlan.id },
      data: { consecutiveFailures: 2, nextRunAt: new Date(Date.now() - 1000) },
    })
    await runDueSavingsPlans()
    const disabled = await prisma.recurringBuyPlan.findUniqueOrThrow({
      where: { id: failPlan.id },
    })
    expect(disabled.active).toBe(false)
    expect(disabled.consecutiveFailures).toBe(3)
  })

  // ---------- ZarKar (سپرده طلا) ----------

  it('زرکار — لیست طرح‌ها، سقف حداقل، قفل طلا در subscribe', async () => {
    const plans = await listZarkarPlans()
    const test = plans.find((p) => p.id === planId)
    expect(test).toBeTruthy()
    expect(test!.periods).toBe(2) // ۶۰ روز → دو دوره ۳۰ روزه

    // کمتر از حداقل طرح
    await expect(
      subscribeZarkar({ userId, kycLevel: 'LEVEL_3' }, { planId, goldGrams: '0.1' }),
    ).rejects.toThrow()
    // KYC سطح صفر
    await expect(
      subscribeZarkar({ userId, kycLevel: 'LEVEL_0' }, { planId, goldGrams: '1' }),
    ).rejects.toThrow()

    await fundGold(userId, 12_000_000n) // ~۱٫۴ گرم برای سپرده ۱ گرمی
    const goldBefore = await goldOf(userId)
    const pos = await subscribeZarkar({ userId, kycLevel: 'LEVEL_3' }, { planId, goldGrams: '1' })
    expect(pos.status).toBe('ACTIVE')

    const goldAfter = await goldOf(userId)
    expect(goldAfter.locked.sub(goldBefore.locked).toString()).toBe('1')

    // لیست موقعیت‌ها شامل سود پرداختی
    const positions = await listUserPositions(userId)
    const mine = positions.find((p) => p.id === pos.id)
    expect(mine).toBeTruthy()
    expect(mine!.planName).toBe('TEST_ZARKAR_PLAN')

    // سررسید کامل → maturity: آزادسازی اصل + پرداخت سود
    const past = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000)
    await prisma.investmentPosition.update({
      where: { id: pos.id },
      data: { startDate: past, endDate: new Date(Date.now() - 1000) },
    })
    const res = await processZarkarPayouts()
    expect(res.matured).toBeGreaterThanOrEqual(1)

    const after = await prisma.investmentPosition.findUniqueOrThrow({
      where: { id: pos.id },
      include: { payouts: true },
    })
    expect(after.status).toBe('MATURED')
    expect(after.payouts.length).toBe(2)
    // مجموع سود = ۱ گرم × ۶٪ = 0.06 گرم (با floor در هر دوره)
    const totalPaid = after.payouts.reduce(
      (acc, p) => acc.add(p.amountGold.toString()),
      new Decimal(0),
    )
    expect(totalPaid.toNumber()).toBeCloseTo(0.06, 4)

    // قفل آزاد شد — balance خالص فقط به اندازه سود رشد کرده
    const goldFinal = await goldOf(userId)
    expect(goldFinal.locked.toString()).toBe(goldBefore.locked.toString())
    expect(goldFinal.balance.sub(goldBefore.balance).toNumber()).toBeCloseTo(0.06, 4)
  })

  // ---------- Coin (سکه/شمش) ----------

  it('سکه — لیست محصولات با قیمت لحظه‌ای؛ بدون قیمت unitPriceToman=null', async () => {
    const priced = await listCoinProducts(PRICE_SELL)
    const mine = priced.find((p) => p.id === coinProductId)
    expect(mine).toBeTruthy()
    expect(mine!.unitPriceToman).toBeTruthy()

    const unpriced = await listCoinProducts(null)
    expect(unpriced.find((p) => p.id === coinProductId)!.unitPriceToman).toBeNull()
  })

  it('تبدیل سکه — طلا و اجرت کسر، CoinHolding تجمیع می‌شود', async () => {
    await fundGold(userId, 30_000_000n) // ~۳٫۵ گرم برای ۳ واحد سکه ۱ گرمی
    await fundUser(userId, 500_000n) // اجرت ۳×۱۰۰هزار + حاشیه
    const goldBefore = await goldOf(userId)
    const tomanBefore = await tomanOf(userId)

    const res = await convertToCoin(
      { userId, kycLevel: 'LEVEL_3' },
      { productId: coinProductId, quantity: 2 },
    )
    expect(res.quantity).toBe(2)
    expect(res.goldSpent).toBe('2')
    expect(res.feePaid).toBe('200000')

    const goldAfter = await goldOf(userId)
    const tomanAfter = await tomanOf(userId)
    expect(goldBefore.balance.sub(goldAfter.balance).toString()).toBe('2')
    expect(tomanBefore.balance.sub(tomanAfter.balance).toFixed(0)).toBe('200000')

    // تبدیل دوم روی همان محصول تجمیع می‌شود
    await convertToCoin({ userId, kycLevel: 'LEVEL_3' }, { productId: coinProductId, quantity: 1 })
    const holdings = await listUserCoinHoldings(userId, PRICE_SELL)
    const h = holdings.find((x) => x.product.id === coinProductId)
    expect(h!.quantity).toBe(3)

    // تعداد خارج از بازه
    await expect(
      convertToCoin({ userId, kycLevel: 'LEVEL_3' }, { productId: coinProductId, quantity: 21 }),
    ).rejects.toThrow()
    // KYC سطح صفر
    await expect(
      convertToCoin({ userId, kycLevel: 'LEVEL_0' }, { productId: coinProductId, quantity: 1 }),
    ).rejects.toThrow()
  })

  // ---------- Price Alert ----------

  it('هشدار قیمت — ساخت/لیست/حذف + trigger یک‌باره با checkPriceAlerts', async () => {
    const alert = await createPriceAlert(userId, {
      direction: 'ABOVE',
      targetPrice: PRICE_BUY - 1n, // قیمت فعلی از آستانه بالاتر است → trigger فوری
    })
    await checkPriceAlerts(PRICE_BUY)

    const after = await prisma.priceAlert.findUniqueOrThrow({ where: { id: alert.id } })
    expect(after.active).toBe(false)
    expect(after.triggeredAt).toBeTruthy()

    // دومین فراخوانی دوباره فایر نمی‌کند (active=false باقی می‌ماند)
    await checkPriceAlerts(PRICE_BUY + 1000n)
    const still = await prisma.priceAlert.findUniqueOrThrow({ where: { id: alert.id } })
    expect(still.active).toBe(false)

    // هشدار دور از قیمت فعال می‌ماند
    const far = await createPriceAlert(userId, { direction: 'BELOW', targetPrice: 1n })
    await checkPriceAlerts(PRICE_BUY)
    expect((await prisma.priceAlert.findUniqueOrThrow({ where: { id: far.id } })).active).toBe(true)

    const list = await listPriceAlerts(userId)
    expect(list.length).toBeGreaterThanOrEqual(2)
    await deletePriceAlert(userId, far.id)
    await expect(deletePriceAlert(otherUserId, alert.id)).rejects.toThrow()
  })

  // ---------- Address Book ----------

  it('آدرس — اولین آدرس پیش‌فرض می‌شود؛ تغییر پیش‌فرض اتمیک', async () => {
    const u2 = otherUserId
    const a1 = await createAddress(u2, {
      recipientName: 'الف',
      mobile: '09121111111',
      address: 'نشانی ۱',
      postalCode: '1111111111',
    })
    expect(a1.isDefault).toBe(true)

    const a2 = await createAddress(u2, {
      recipientName: 'ب',
      mobile: '09122222222',
      address: 'نشانی ۲',
      postalCode: '2222222222',
    })
    expect(a2.isDefault).toBe(false)

    await setDefaultAddress(u2, a2.id)
    const list = await listAddresses(u2)
    expect(list.find((a) => a.id === a2.id)!.isDefault).toBe(true)
    expect(list.find((a) => a.id === a1.id)!.isDefault).toBe(false)
    expect(list[0]!.id).toBe(a2.id) // مرتب‌سازی: پیش‌فرض اول

    await expect(deleteAddress(u2, 'nonexistent')).rejects.toThrow()
    await deleteAddress(u2, a1.id)
  })

  // ---------- Bank Account ----------

  it('حساب بانکی — تشخیص بانک از شبا، یکتا بودن، چرخش پیش‌فرض', async () => {
    const acc = await createBankAccount(userId, { iban: IBAN, alias: 'حقوقی' })
    expect(acc.iban).toBe(IBAN)
    expect(acc.bankName).not.toBe('بانک')

    // شبا تکراری → conflict
    await expect(createBankAccount(userId, { iban: IBAN })).rejects.toThrow()

    const acc2 = await createBankAccount(userId, { iban: IBAN2 })
    const list = await prisma.bankAccount.findMany({ where: { userId } })
    expect(list.find((a) => a.id === acc.id)!.isDefault).toBe(true)
    expect(list.find((a) => a.id === acc2.id)!.isDefault).toBe(false)

    // getOwnedIban — مالکیت و مسدودی
    expect(await getOwnedIban(userId, acc.id)).toBe(IBAN)
    await expect(getOwnedIban(otherUserId, acc.id)).rejects.toThrow()
    await prisma.bankAccount.update({
      where: { id: acc2.id },
      data: { blockedAt: new Date() },
    })
    await expect(getOwnedIban(userId, acc2.id)).rejects.toThrow()
    await prisma.bankAccount.update({ where: { id: acc2.id }, data: { blockedAt: null } })

    await setDefaultBankAccount(userId, acc2.id)
    // حذف پیش‌فرض → قدیمی‌ترین پیش‌فرض می‌شود
    await deleteBankAccount(userId, acc2.id)
    const remaining = await prisma.bankAccount.findFirstOrThrow({ where: { userId } })
    expect(remaining.id).toBe(acc.id)
    expect(remaining.isDefault).toBe(true)
  })

  // ---------- Financial Summary ----------

  it('getFinancialSummary — موجودی و شمارنده‌ها با واقعیت DB هم‌خوان', async () => {
    const s = await getFinancialSummary(userId)
    const { balance } = await tomanOf(userId)
    const gold = await goldOf(userId)

    expect(s.tomanBalance).toBe(balance.toFixed(0))
    expect(s.goldBalance).toBe(gold.balance.toString())
    expect(s.sellPrice).toBe(PRICE_SELL.toString())
    expect(s.installments.activeContracts).toBe(0)
    expect(s.activeDeliveries).toBe(0)
    expect(s.bankAccounts).toBe(1)
  })

  it('wallet.service — getWalletSummary موجودی کل = آزاد + مسدود', async () => {
    const { getWalletSummary } = await import('../../src/lib/finance/wallet.service')
    const s = await getWalletSummary(userId)
    const { balance, locked } = await tomanOf(userId)

    const toman = s.accounts.find((a) => a.assetType === 'TOMAN')!
    const gold = s.accounts.find((a) => a.assetType === 'GOLD')!
    expect(toman.balance).toBe(balance.add(locked).toString())
    expect(toman.lockedBalance).toBe(locked.toString())
    expect(toman.available).toBe(balance.toString())
    expect(gold).toBeTruthy()
    expect(s.status).toBeTruthy()
  })

  it('wallet.service — listUserTransactions فیلتر type/status/date و صفحه‌بندی', async () => {
    const { listUserTransactions, listUserDeposits } = await import(
      '../../src/lib/finance/wallet.service'
    )

    const all = await listUserTransactions(userId, 1, 50)
    expect(all.total).toBeGreaterThanOrEqual(1)
    expect(all.items[0]!.amount).toBeTruthy()

    const deposits = await listUserTransactions(userId, 1, 50, { type: 'DEPOSIT' })
    expect(deposits.items.every((t) => t.type === 'DEPOSIT')).toBe(true)

    const none = await listUserTransactions(userId, 1, 50, {
      from: new Date(Date.now() + 60_000),
    })
    expect(none.total).toBe(0)

    const deps = await listUserDeposits(userId, 1, 50)
    expect(deps.total).toBeGreaterThanOrEqual(1)
    expect(deps.items.every((t) => t.status !== undefined)).toBe(true)
  })
})
