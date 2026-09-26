// ============================================
// Zar30 - Admin Services Integration Test (DB واقعی)
// ============================================
// پوشش سرویس‌های ادمینی که قبلاً تست نداشتند:
//   ops (کارت/انتقال/پرداخت/آدرس)، system (broadcast/template/member/
//   settings/seo/health/halt)، fees (rule/userFee/limit/kycLevel)،
//   risk (rule/evaluate/events/fraud)، reports (export/journal/ledger)،
//   commerce (product/category/discount/coinHoldings)، delivery list،
//   automation (sip/alert/security/ratelimit)، platform (audit/session/
//   notification/team/content/flags)، search
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '../../src/lib/finance/money'
import { ensureWallet } from '../../src/lib/finance/wallet.service'
import {
  listAdminBankAccounts,
  getAdminBankAccount,
  setBankAccountBlocked,
  listAdminTransfers,
  getAdminTransfer,
  setTransferFlag,
  listAdminPayments,
  listAdminAddresses,
} from '../../src/lib/services/admin-ops.service'
import {
  broadcastAdminNotification,
  listAdminNotificationTemplates,
  upsertAdminNotificationTemplate,
  deleteAdminNotificationTemplate,
  listAdminRoleMatrix,
  getAdminMember,
  updateAdminMember,
  listAdminSettings,
  upsertAdminSetting,
  deleteAdminSetting,
  upsertAdminSeo,
  listAdminSeo,
  getAdminSystemHealth,
  getAdminProfile,
  getHaltFlags,
  setHaltFlag,
  isTradingHalted,
} from '../../src/lib/services/admin-system.service'
import {
  listAdminFeeRules,
  upsertAdminFeeRule,
  deleteAdminFeeRule,
  listAdminUserFees,
  upsertAdminUserFee,
  deleteAdminUserFee,
  listAdminLimitRules,
  upsertAdminLimitRule,
  deleteAdminLimitRule,
  listAdminKycLevels,
  upsertAdminKycLevel,
} from '../../src/lib/services/admin-fees.service'
import {
  listAdminRiskRules,
  upsertAdminRiskRule,
  deleteAdminRiskRule,
  evaluateUserRisk,
  listAdminRiskEvents,
  reviewAdminRiskEvent,
  listAdminFraudSignals,
} from '../../src/lib/services/admin-risk.service'
import {
  generateAdminExport,
  listAdminExports,
  listAdminJournalEntries,
  listAdminLedgerAccounts,
} from '../../src/lib/services/admin-reports.service'
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  listAdminCategories,
  upsertAdminCategory,
  listAdminDiscounts,
  upsertAdminDiscount,
  listAdminCoinHoldings,
  listAdminCoinProductOptions,
} from '../../src/lib/services/admin-commerce.service'
import {
  listAdminDeliveries,
  getAdminDelivery,
} from '../../src/lib/services/admin-delivery.service'
import {
  listAdminSavingsPlans,
  setAdminSavingsPlanActive,
  listAdminPriceAlerts,
  listAdminSecurityEvents,
  listAdminRateLimits,
  upsertAdminRateLimit,
  deleteAdminRateLimit,
} from '../../src/lib/services/admin-automation.service'
import {
  listAdminAuditLogs,
  listAdminSessions,
  listAdminNotifications,
  listAdminTeam,
  listAdminContent,
  listAdminFlags,
} from '../../src/lib/services/admin-platform.service'
import { searchAdminEntities } from '../../src/lib/services/admin-search.service'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

let ADMIN = { adminId: '', adminRole: 'SUPER_ADMIN' }
const AUDIT = { ip: '127.0.0.1', userAgent: 'vitest', requestId: 'test-req' }
const PAGE = { page: 1, limit: 20, direction: 'desc' as const }

describe('Admin Services (Real PostgreSQL)', () => {
  let userId: string
  let adminUserId: string
  let secondAdminId: string
  let secondAdminUserId: string
  let bankAccountId: string
  let transferId: string
  let deliveryId: string
  let sipPlanId: string
  let templateId: string
  let feeRuleId: string
  let userFeeId: string
  let limitRuleId: string
  let riskRuleId: string
  let productId: string
  let categoryId: string
  let discountId: string
  let rateLimitId: string
  let seoPage: string

  beforeAll(async () => {
    const suffix = Date.now().toString().slice(-9)
    const u = await prisma.user.create({
      data: {
        mobile: `0951${suffix}`,
        passwordHash: 'test',
        referralCode: `S${suffix}A`,
        kycLevel: 'LEVEL_2',
        firstName: 'تست',
        lastName: 'ادمین‌سرویس',
      },
    })
    userId = u.id
    await ensureWallet(prisma, userId)

    const au = await prisma.user.create({
      data: {
        mobile: `0952${suffix}`,
        passwordHash: 'test',
        referralCode: `S${suffix}B`,
        kycLevel: 'LEVEL_3',
      },
    })
    adminUserId = au.id
    const admin = await prisma.adminUser.create({
      data: { userId: au.id, role: 'SUPER_ADMIN', permissions: [] },
    })
    ADMIN = { adminId: admin.id, adminRole: 'SUPER_ADMIN' }

    // ادمین دوم برای تست updateAdminMember — تغییر نقش خودِ ادمین ممنوع است
    const au2 = await prisma.user.create({
      data: {
        mobile: `0953${suffix}`,
        passwordHash: 'test',
        referralCode: `S${suffix}C`,
        kycLevel: 'LEVEL_3',
      },
    })
    const admin2 = await prisma.adminUser.create({
      data: { userId: au2.id, role: 'SUPPORT', permissions: [] },
    })
    secondAdminId = admin2.id
    secondAdminUserId = au2.id

    // fixtureهایی که سرویس‌ها روی آن‌ها عمل می‌کنند
    const bank = await prisma.bankAccount.create({
      data: {
        userId,
        bankCode: '010',
        bankName: 'بانک ملی ایران',
        iban: `IR0601${suffix}00000000001`,
      },
    })
    bankAccountId = bank.id

    const tr = await prisma.internalTransfer.create({
      data: {
        senderId: userId,
        recipientId: adminUserId,
        assetType: 'TOMAN',
        tomanAmount: 10_000n,
        kind: 'TRANSFER',
      },
    })
    transferId = tr.id

    const del = await prisma.goldDeliveryRequest.create({
      data: { userId, grams: new Decimal('0.5'), method: 'PICKUP' },
    })
    deliveryId = del.id

    const sip = await prisma.recurringBuyPlan.create({
      data: {
        userId,
        tomanAmount: 50_000n,
        frequency: 'DAILY',
        nextRunAt: new Date(Date.now() + 86400_000),
      },
    })
    sipPlanId = sip.id

    await prisma.priceAlert.create({
      data: { userId, direction: 'ABOVE', targetPrice: 9_999_999n },
    })

    const cat = await prisma.productCategory.create({
      data: { name: `دسته تست ${suffix}`, slug: `test-cat-${suffix}` },
    })
    categoryId = cat.id
  })

  afterAll(async () => {
    const allUsers = [userId, adminUserId, secondAdminUserId].filter(Boolean)
    const keep = async <T>(p: Promise<T>) => p.catch(() => null)

    await keep(
      prisma.interestPayout.deleteMany({ where: { position: { userId: { in: allUsers } } } }),
    )
    await prisma.investmentPosition.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.goldDeliveryRequest.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.internalTransfer.deleteMany({ where: { senderId: { in: allUsers } } })
    await prisma.internalTransfer.deleteMany({ where: { recipientId: { in: allUsers } } })
    await prisma.recurringBuyPlan.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.priceAlert.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.bankAccount.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.address.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.notification.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.userFeeOverride.deleteMany({ where: { userId: { in: allUsers } } })
    if (productId) await prisma.product.deleteMany({ where: { id: productId } })
    if (categoryId) await prisma.productCategory.deleteMany({ where: { id: categoryId } })
    if (discountId) await prisma.discountCode.deleteMany({ where: { id: discountId } })
    if (feeRuleId) await prisma.feeRule.deleteMany({ where: { id: feeRuleId } })
    if (limitRuleId) await prisma.limitRule.deleteMany({ where: { id: limitRuleId } })
    if (riskRuleId) {
      await prisma.riskEvent.deleteMany({ where: { ruleId: riskRuleId } })
      await prisma.riskRule.deleteMany({ where: { id: riskRuleId } })
    }
    if (rateLimitId) await prisma.rateLimitConfig.deleteMany({ where: { id: rateLimitId } })
    if (templateId) await prisma.notificationTemplate.deleteMany({ where: { id: templateId } })
    if (seoPage) await prisma.platformSetting.deleteMany({ where: { key: `seo.${seoPage}` } })
    await prisma.platformSetting.deleteMany({ where: { key: { startsWith: 'test.' } } })
    await prisma.exportRecord.deleteMany({ where: { adminId: ADMIN.adminId || 'none' } })
    await prisma.auditLog.deleteMany({ where: { targetUserId: { in: allUsers } } })
    await prisma.auditLog.deleteMany({ where: { actorId: ADMIN.adminId || 'none' } })
    await prisma.session.deleteMany({ where: { userId: { in: allUsers } } })
    const wallets = await prisma.wallet.findMany({ where: { userId: { in: allUsers } } })
    await prisma.assetAccount.deleteMany({ where: { walletId: { in: wallets.map((w) => w.id) } } })
    await prisma.wallet.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.adminUser.deleteMany({ where: { userId: { in: allUsers } } })
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } })
  })

  // ---------- admin-ops ----------

  it('ops — bank accounts: list + detail + block/unblock', async () => {
    const { rows, total } = await listAdminBankAccounts({ ...PAGE, q: '0951' })
    expect(total).toBeGreaterThanOrEqual(1)
    expect(rows.find((r) => r.id === bankAccountId)).toBeTruthy()

    const detail = await getAdminBankAccount(bankAccountId)
    expect(detail?.bankName).toBe('بانک ملی ایران')
    // نسخه masked برای نمایش موجود است؛ iban خام برای عملیات بانکی ادمین
    expect(detail?.ibanMasked).toContain('••••')

    const blocked = await setBankAccountBlocked(ADMIN, bankAccountId, true, 'مشکوک', AUDIT)
    expect(blocked.blocked).toBe(true)
    // دوبار مسدود → خطا
    await expect(setBankAccountBlocked(ADMIN, bankAccountId, true, 'x', AUDIT)).rejects.toThrow()
    await setBankAccountBlocked(ADMIN, bankAccountId, false, undefined, AUDIT)
  })

  it('ops — transfers: list + detail + flag/unflag', async () => {
    const { rows } = await listAdminTransfers({ ...PAGE, kind: 'TRANSFER' })
    expect(rows.find((r) => r.id === transferId)).toBeTruthy()

    const detail = await getAdminTransfer(transferId)
    expect(detail?.tomanAmount).toBe('10000')

    await setTransferFlag(ADMIN, transferId, true, 'انتقال مشکوک', AUDIT)
    const flagged = await listAdminTransfers({ ...PAGE, flagged: 'true' })
    expect(flagged.rows.find((r) => r.id === transferId)).toBeTruthy()
    await setTransferFlag(ADMIN, transferId, false, undefined, AUDIT)
  })

  it('ops — payments + addresses list', async () => {
    const payments = await listAdminPayments({ ...PAGE })
    expect(Array.isArray(payments.rows)).toBe(true)
    const addresses = await listAdminAddresses({ ...PAGE })
    expect(Array.isArray(addresses.rows)).toBe(true)
  })

  // ---------- admin-system ----------

  it('system — broadcast به audience محدود + قالب notification CRUD', async () => {
    // audience: فقط کاربر تست KYC_APPROVED — حداقل ۱ نفر
    const res = await broadcastAdminNotification(
      ADMIN,
      { title: 'پیام تست', body: 'متن تست broadcast', audience: 'KYC_APPROVED' },
      AUDIT,
    )
    expect(res.sent).toBeGreaterThanOrEqual(1)

    const tpl = await upsertAdminNotificationTemplate(
      ADMIN,
      {
        key: `test.tpl.${Date.now()}`,
        channels: ['IN_APP'],
        titleTemplate: 'تیتر {{name}}',
        bodyTemplate: 'بدنه {{name}}',
        variables: ['name'],
      },
      AUDIT,
    )
    templateId = tpl.id
    const list = await listAdminNotificationTemplates()
    expect(list.find((t) => t.id === templateId)).toBeTruthy()
    await deleteAdminNotificationTemplate(ADMIN, templateId, AUDIT)
    expect(
      (await listAdminNotificationTemplates()).find((t) => t.id === templateId),
    ).toBeUndefined()
    templateId = ''
  })

  it('system — member get/update + role matrix', async () => {
    const matrix = listAdminRoleMatrix()
    expect(matrix.length).toBeGreaterThan(0)

    const member = await getAdminMember(ADMIN.adminId)
    expect(member?.role).toBe('SUPER_ADMIN')

    // تغییر نقش عضو دیگر → موفق؛ تغییر نقش خودِ ادمین → خطا
    const updated = await updateAdminMember(
      ADMIN,
      secondAdminId,
      { role: 'FINANCE', reason: 'تست به‌روزرسانی نقش' },
      AUDIT,
    )
    expect(updated.id).toBe(secondAdminId)
    expect(updated.role).toBe('FINANCE')
    await expect(
      updateAdminMember(ADMIN, ADMIN.adminId, { role: 'SUPPORT' }, AUDIT),
    ).rejects.toThrow()
  })

  it('system — settings upsert/list/delete + SEO upsert/list', async () => {
    await upsertAdminSetting(ADMIN, { key: 'test.setting', value: { a: 1 } }, AUDIT)
    const settings = await listAdminSettings(undefined, 'test.')
    expect(settings.find((s) => s.key === 'test.setting')).toBeTruthy()
    await deleteAdminSetting(ADMIN, 'test.setting', AUDIT)

    const seo = await upsertAdminSeo(
      ADMIN,
      {
        page: '/test-page',
        title: 'تست سئو',
        description: 'توضیح',
        keywords: ['طلای'],
        ogImage: '',
      },
      AUDIT,
    )
    seoPage = seo.page
    const seoList = await listAdminSeo()
    expect(seoList.find((s) => s.page === seoPage)).toBeTruthy()
  })

  it('system — health + profile + halt flags', async () => {
    const health = await getAdminSystemHealth()
    expect(health).toBeTruthy()

    const profile = await getAdminProfile(ADMIN.adminId)
    expect(profile?.role).toBe('SUPER_ADMIN')

    const flags = await getHaltFlags()
    expect(typeof flags.trading.halted).toBe('boolean')
    // halt trading → isTradingHalted true → برگردان
    await setHaltFlag(ADMIN, 'TRADING', true, AUDIT)
    expect(await isTradingHalted()).toBe(true)
    await setHaltFlag(ADMIN, 'TRADING', false, AUDIT)
    expect(await isTradingHalted()).toBe(false)
  })

  // ---------- admin-fees ----------

  it('fees — rule CRUD + userFee + limitRule + kycLevel', async () => {
    const rule = await upsertAdminFeeRule(
      ADMIN,
      {
        name: 'کارمزد تست',
        kind: 'KYC_LEVEL',
        kycLevel: 'LEVEL_1',
        buyFeeBps: 75,
        sellFeeBps: 60,
        priority: 5,
        active: true,
      },
      AUDIT,
    )
    feeRuleId = rule.id
    expect((await listAdminFeeRules()).find((r) => r.id === feeRuleId)).toBeTruthy()
    await upsertAdminFeeRule(
      ADMIN,
      {
        name: 'کارمزد تست ویرایش',
        kind: 'KYC_LEVEL',
        kycLevel: 'LEVEL_1',
        buyFeeBps: 70,
        sellFeeBps: 55,
        priority: 6,
        active: true,
      },
      AUDIT,
      feeRuleId,
    )
    expect((await listAdminFeeRules()).find((r) => r.id === feeRuleId)!.buyFeeBps).toBe(70)

    const uf = await upsertAdminUserFee(
      ADMIN,
      { userId, buyFeeBps: 10, sellFeeBps: 10, note: 'ویژه' },
      AUDIT,
    )
    userFeeId = uf.id
    const userFees = await listAdminUserFees(PAGE.page, PAGE.limit)
    expect(userFees.rows.find((r) => r.id === userFeeId)).toBeTruthy()
    await deleteAdminUserFee(ADMIN, userFeeId, AUDIT)
    userFeeId = ''

    const lr = await upsertAdminLimitRule(
      ADMIN,
      { scope: 'WITHDRAW', period: 'DAILY', amountToman: 5_000_000n, active: true },
      AUDIT,
    )
    limitRuleId = lr.id
    const limits = await listAdminLimitRules({ ...PAGE, scope: 'WITHDRAW' })
    expect(limits.rows.find((r) => r.id === limitRuleId)).toBeTruthy()
    await deleteAdminLimitRule(ADMIN, limitRuleId, AUDIT)
    limitRuleId = ''

    const levels = await listAdminKycLevels()
    expect(levels.length).toBeGreaterThanOrEqual(4)
    await upsertAdminKycLevel(
      ADMIN,
      { level: 'LEVEL_1', name: 'سطح یک تست', rank: 1, description: null },
      AUDIT,
    )
    expect((await listAdminKycLevels()).find((l) => l.level === 'LEVEL_1')!.name).toBe('سطح یک تست')
    // بازگردانی نام پیش‌فرض
    await upsertAdminKycLevel(
      ADMIN,
      { level: 'LEVEL_1', name: 'پایه', rank: 1, description: null },
      AUDIT,
    )

    await deleteAdminFeeRule(ADMIN, feeRuleId, AUDIT)
    feeRuleId = ''
  })

  // ---------- admin-risk ----------

  it('risk — rule CRUD + evaluate + events + fraud signals', async () => {
    const rule = await upsertAdminRiskRule(
      ADMIN,
      {
        name: 'قانون تست انتقال',
        metric: 'TRANSFER_COUNT',
        threshold: 0, // هر انتقال → رویداد
        windowHours: 24,
        scoreWeight: 10,
        active: true,
      },
      AUDIT,
    )
    riskRuleId = rule.id
    expect((await listAdminRiskRules()).find((r) => r.id === riskRuleId)).toBeTruthy()

    // ارزیابی واقعی — انتقال fixture باید رویداد بسازد
    const evalRes = await evaluateUserRisk(userId)
    expect(evalRes.eventsCreated).toBeGreaterThanOrEqual(1)

    const events = await listAdminRiskEvents({ ...PAGE, status: 'open' })
    const mine = events.rows.find((e) => e.user?.id === userId)
    expect(mine).toBeTruthy()

    await reviewAdminRiskEvent(ADMIN, mine!.id, 'بررسی شد', AUDIT)
    const reviewed = await listAdminRiskEvents({ ...PAGE, status: 'reviewed' })
    expect(reviewed.rows.find((e) => e.id === mine!.id)).toBeTruthy()

    const fraud = await listAdminFraudSignals({ ...PAGE })
    expect(Array.isArray(fraud.rows)).toBe(true)

    await deleteAdminRiskRule(ADMIN, riskRuleId, AUDIT)
    riskRuleId = ''
  })

  // ---------- admin-reports ----------

  it('reports — export CSV + journal + ledger accounts', async () => {
    const exp = await generateAdminExport(ADMIN, { kind: 'transfers' }, AUDIT)
    expect(exp.filename).toContain('.csv')
    expect(exp.rowCount).toBeGreaterThanOrEqual(1)
    expect(exp.csv).toContain('TRANSFER')

    const exports = await listAdminExports(1, 10)
    expect(exports.total).toBeGreaterThanOrEqual(1)

    const journal = await listAdminJournalEntries({ ...PAGE })
    expect(Array.isArray(journal.rows)).toBe(true)

    const accounts = await listAdminLedgerAccounts()
    expect(accounts.find((a) => a.code === 'ASSET_TOMAN')).toBeTruthy()
  })

  // ---------- admin-commerce ----------

  it('commerce — product/category/discount CRUD + coin holdings', async () => {
    const product = await createAdminProduct(
      ADMIN,
      {
        sku: `TST-${Date.now()}`,
        name: 'محصول تست',
        categoryId,
        kind: 'COIN',
        weightGrams: '2.5',
        premiumToman: 75_000n,
        stock: 5,
        active: true,
        sortOrder: 0,
      },
      AUDIT,
    )
    productId = product.id
    const products = await listAdminProducts({ ...PAGE, kind: 'COIN' })
    expect(products.rows.find((p) => p.id === productId)).toBeTruthy()

    await updateAdminProduct(
      ADMIN,
      productId,
      {
        sku: `TST-${Date.now()}`,
        name: 'محصول تست ویرایش',
        categoryId,
        kind: 'COIN',
        weightGrams: '2.5',
        premiumToman: 80_000n,
        stock: 7,
        active: true,
        sortOrder: 1,
      },
      AUDIT,
    )
    const detail = await listAdminProducts({ ...PAGE, q: 'ویرایش' })
    expect(detail.rows[0]?.name).toContain('ویرایش')

    const cats = await listAdminCategories({ ...PAGE })
    expect(cats.rows.find((c) => c.id === categoryId)).toBeTruthy()
    await upsertAdminCategory(
      ADMIN,
      { name: 'دسته تست۲', slug: `test-cat2-${Date.now()}`, sortOrder: 0, active: true },
      AUDIT,
    )

    const disc = await upsertAdminDiscount(
      ADMIN,
      {
        code: `T${Date.now().toString().slice(-8)}`,
        type: 'FIXED',
        value: 1000n,
        appliesTo: 'TRADE_FEE',
        active: true,
      },
      AUDIT,
    )
    discountId = disc.id
    const discs = await listAdminDiscounts({ ...PAGE })
    expect(discs.rows.find((d) => d.id === discountId)).toBeTruthy()

    const holdings = await listAdminCoinHoldings({ ...PAGE })
    expect(Array.isArray(holdings.rows)).toBe(true)
    const options = await listAdminCoinProductOptions()
    expect(Array.isArray(options)).toBe(true)
  })

  // ---------- admin-delivery ----------

  it('delivery — list با فیلتر status + detail با آدرس', async () => {
    const { rows, total } = await listAdminDeliveries({ ...PAGE, status: 'PENDING' })
    expect(total).toBeGreaterThanOrEqual(1)
    expect(rows.find((r) => r.id === deliveryId)).toBeTruthy()

    const detail = await getAdminDelivery(deliveryId)
    expect(detail?.grams).toBe('0.5')
    expect(detail?.user.mobile).toContain('0951')
  })

  // ---------- admin-automation ----------

  it('automation — sip list/toggle + alerts + security events + rate limits', async () => {
    const sips = await listAdminSavingsPlans({ ...PAGE, status: 'active' })
    expect(sips.rows.find((s) => s.id === sipPlanId)).toBeTruthy()

    const paused = await setAdminSavingsPlanActive(ADMIN, sipPlanId, false, AUDIT, 'تست توقف')
    expect(paused.active).toBe(false)
    const pausedList = await listAdminSavingsPlans({ ...PAGE, status: 'paused' })
    expect(pausedList.rows.find((s) => s.id === sipPlanId)).toBeTruthy()

    const alerts = await listAdminPriceAlerts({ ...PAGE, status: 'active' })
    expect(alerts.rows.length).toBeGreaterThanOrEqual(1)

    const secEvents = await listAdminSecurityEvents({ ...PAGE })
    expect(Array.isArray(secEvents.rows)).toBe(true)

    const rl = await upsertAdminRateLimit(
      ADMIN,
      { key: `test.rl.${Date.now()}`, limit: 7, windowSeconds: 60, scope: 'IP', active: true },
      AUDIT,
    )
    rateLimitId = rl.id
    const rls = await listAdminRateLimits()
    expect(rls.find((r) => r.id === rateLimitId)).toBeTruthy()
    await deleteAdminRateLimit(ADMIN, rateLimitId, AUDIT)
    rateLimitId = ''
  })

  // ---------- admin-platform ----------

  it('platform — audit/session/notification/team/content/flags lists', async () => {
    const audits = await listAdminAuditLogs({ ...PAGE })
    expect(audits.total).toBeGreaterThanOrEqual(1)
    expect(audits.rows[0]?.action).toBeTruthy()

    const sessions = await listAdminSessions({ ...PAGE })
    expect(Array.isArray(sessions.rows)).toBe(true)

    const notifs = await listAdminNotifications({ ...PAGE })
    expect(notifs.total).toBeGreaterThanOrEqual(1) // broadcast تست قبلی

    const team = await listAdminTeam({ ...PAGE })
    expect(team.rows.find((t) => t.id === ADMIN.adminId)).toBeTruthy()

    const content = await listAdminContent({ ...PAGE })
    expect(Array.isArray(content.rows)).toBe(true)

    const flags = await listAdminFlags({ ...PAGE })
    expect(Array.isArray(flags.rows)).toBe(true)
  })

  // ---------- admin-search ----------

  it('search — کاربر با موبایل/نام پیدا می‌شود', async () => {
    const { resolvePermissions } = await import('../../src/lib/auth/rbac')
    const result = await searchAdminEntities('0951', resolvePermissions('SUPER_ADMIN', []))
    const hit = result.find(
      (r) => r.type === 'user' && (r.label.includes('0951') || r.description.includes('0951')),
    )
    expect(hit).toBeTruthy()
  })
})
