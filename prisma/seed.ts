// ============================================
// Zar30 - Database Seed (Development Only)
// ============================================
// این فایل فقط برای محیط development استفاده می‌شود
// Seed data باید واضحاً از production data جدا باشد
// ============================================

import 'dotenv/config'
import { PrismaClient, AssetType, LedgerAccountType, RateLimitScope } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 نیازمند Driver Adapter است
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // Ledger Accounts (Double-Entry Accounting)
  const ledgerAccounts: {
    code: string
    type: LedgerAccountType
    name: string
    assetType: AssetType | null
  }[] = [
    // Asset Accounts (دارایی‌های کاربران)
    { code: 'ASSET_TOMAN', type: 'ASSET', name: 'Toman Balance', assetType: 'TOMAN' },
    { code: 'ASSET_GOLD', type: 'ASSET', name: 'Gold Balance', assetType: 'GOLD' },
    { code: 'ASSET_LOCKED_TOMAN', type: 'ASSET', name: 'Locked Toman', assetType: 'TOMAN' },
    { code: 'ASSET_LOCKED_GOLD', type: 'ASSET', name: 'Locked Gold', assetType: 'GOLD' },
    // صندوق تومانی پلتفرم — طرف مقابل واریز/برداشت کاربران
    {
      code: 'ASSET_PLATFORM_TOMAN',
      type: 'ASSET',
      name: 'Platform Toman Pool',
      assetType: 'TOMAN',
    },

    // Revenue Accounts (درآمد پلتفرم)
    { code: 'REVENUE_SPREAD', type: 'REVENUE', name: 'Spread Revenue', assetType: null },
    { code: 'REVENUE_FEE', type: 'REVENUE', name: 'Trading Fee Revenue', assetType: null },
    {
      code: 'REVENUE_INSTALLMENT',
      type: 'REVENUE',
      name: 'Installment Fee Revenue',
      assetType: null,
    },
    {
      code: 'REVENUE_WITHDRAWAL',
      type: 'REVENUE',
      name: 'Withdrawal Fee Revenue',
      assetType: null,
    },
    { code: 'REVENUE_DELIVERY', type: 'REVENUE', name: 'Delivery Fee Revenue', assetType: null },

    // Expense Accounts (هزینه‌ها)
    { code: 'EXPENSE_OPERATIONAL', type: 'EXPENSE', name: 'Operational Expenses', assetType: null },

    // Liability Accounts (بدهی‌ها)
    {
      code: 'LIABILITY_USER_TOMAN',
      type: 'LIABILITY',
      name: 'User Toman Deposits',
      assetType: 'TOMAN',
    },
    {
      code: 'LIABILITY_GOLD_INVENTORY',
      type: 'LIABILITY',
      name: 'Gold Inventory',
      assetType: 'GOLD',
    },
    {
      code: 'LIABILITY_INTEREST_PAYABLE',
      type: 'LIABILITY',
      name: 'Interest Payable',
      assetType: null,
    },

    // Equity Accounts (حقوق صاحبان سهام)
    { code: 'EQUITY_CAPITAL', type: 'EQUITY', name: 'Platform Capital', assetType: null },
  ]

  for (const account of ledgerAccounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      update: {},
      create: {
        code: account.code,
        type: account.type,
        name: account.name,
        assetType: account.assetType,
      },
    })
  }
  console.log('✅ Ledger accounts seeded')

  // Rate Limit Configs (Configurable)
  const rateLimits: { key: string; limit: number; windowSeconds: number; scope: RateLimitScope }[] =
    [
      { key: 'api.general', limit: 100, windowSeconds: 60, scope: 'IP' },
      { key: 'otp.send', limit: 5, windowSeconds: 3600, scope: 'MOBILE' },
      { key: 'otp.verify', limit: 10, windowSeconds: 3600, scope: 'MOBILE' },
      { key: 'auth.login', limit: 10, windowSeconds: 3600, scope: 'MOBILE' },
      { key: 'auth.register', limit: 10, windowSeconds: 3600, scope: 'IP' },
      { key: 'auth.password_reset', limit: 5, windowSeconds: 3600, scope: 'MOBILE' },
      { key: 'trading.execute', limit: 30, windowSeconds: 60, scope: 'USER' },
      { key: 'wallet.write', limit: 10, windowSeconds: 60, scope: 'USER' },
      { key: 'admin.api', limit: 200, windowSeconds: 60, scope: 'IP' },
    ]

  for (const config of rateLimits) {
    await prisma.rateLimitConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        limit: config.limit,
        windowSeconds: config.windowSeconds,
        scope: config.scope,
      },
    })
  }
  console.log('✅ Rate limit configs seeded')

  // Feature Flags
  const featureFlags = [
    {
      key: 'trading_enabled',
      enabled: true,
      rolloutPercent: 100,
      description: 'Enable gold trading',
    },
    {
      key: 'installment_enabled',
      enabled: true,
      rolloutPercent: 100,
      description: 'Enable installment purchases',
    },
    {
      key: 'investment_enabled',
      enabled: true,
      rolloutPercent: 100,
      description: 'Enable investment plans',
    },
    {
      key: 'physical_delivery_enabled',
      enabled: false,
      rolloutPercent: 0,
      description: 'Enable physical delivery',
    },
    {
      key: 'referral_enabled',
      enabled: true,
      rolloutPercent: 100,
      description: 'Enable referral system',
    },
    { key: 'pwa_enabled', enabled: true, rolloutPercent: 100, description: 'Enable PWA features' },
    {
      key: 'mobile_app_enabled',
      enabled: false,
      rolloutPercent: 0,
      description: 'Enable mobile app',
    },
  ]

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    })
  }
  console.log('✅ Feature flags seeded')

  // قیمت اولیه طلا — فقط برای dev؛ production از مسیر admin/provider می‌آید
  const existingPrice = await prisma.goldPrice.findFirst()
  if (!existingPrice) {
    const buyPrice = 7_500_000n
    await prisma.goldPrice.create({
      data: {
        buyPrice,
        sellPrice: buyPrice - 50_000n,
        rawPrice: buyPrice - 50_000n,
        spread: 0.0059,
        source: 'seed',
        recordedAt: new Date(),
      },
    })
    console.log('✅ Initial gold price seeded')
  }

  // Installment Plans — طرح‌های کانونیکال ۳/۶/۱۲/۱۸ ماهه
  // منطبق بر src/lib/installments/plans.ts: حداقل ۱۰م تومان، سود سالانه ۲۳٪،
  // هزینه خدمات مقیاس‌پذیر به ازای هر ۱۰م تومان اعتبار
  const installmentPlans = [
    {
      name: 'طرح ۳ ماهه',
      months: 3,
      downPaymentPercent: 0,
      interestRate: 23,
      fee: 0,
      minAmount: 10000000,
      maxAmount: 100000000,
      serviceFeePer10M: 500000,
      active: true,
    },
    {
      name: 'طرح ۶ ماهه',
      months: 6,
      downPaymentPercent: 0,
      interestRate: 23,
      fee: 0,
      minAmount: 10000000,
      maxAmount: 200000000,
      serviceFeePer10M: 800000,
      active: true,
    },
    {
      name: 'طرح ۱۲ ماهه',
      months: 12,
      downPaymentPercent: 0,
      interestRate: 23,
      fee: 0,
      minAmount: 10000000,
      maxAmount: 400000000,
      serviceFeePer10M: 1400000,
      active: true,
    },
    {
      name: 'طرح ۱۸ ماهه',
      months: 18,
      downPaymentPercent: 0,
      interestRate: 23,
      fee: 0,
      minAmount: 10000000,
      maxAmount: 500000000,
      serviceFeePer10M: 2100000,
      active: true,
    },
  ]

  for (const plan of installmentPlans) {
    await prisma.installmentPlan.create({
      data: plan,
    })
  }
  console.log('✅ Installment plans seeded')

  // ZarKar Plans (سپرده طلا) — PENDING BUSINESS DECISION - dev defaults
  // rate = درصد کل سود در کل مدت طرح (پرداخت هر ۳۰ روز به صورت طلا)
  const investmentPlans = [
    {
      name: 'زرکار ۳ ماهه',
      durationDays: 90,
      minGoldGram: 0.1,
      interestRateType: 'FIXED' as const,
      rate: 3,
      active: true,
    },
    {
      name: 'زرکار ۶ ماهه',
      durationDays: 180,
      minGoldGram: 0.1,
      interestRateType: 'FIXED' as const,
      rate: 8,
      active: true,
    },
    {
      name: 'زرکار ۱۲ ماهه',
      durationDays: 365,
      minGoldGram: 0.1,
      interestRateType: 'FIXED' as const,
      rate: 20,
      active: true,
    },
  ]

  // طرح‌های بدون موقعیت فعال جایگزین می‌شوند — موقعیت‌های موجود دست‌نخورده می‌مانند
  await prisma.investmentPlan.deleteMany({ where: { positions: { none: {} } } })

  for (const plan of investmentPlans) {
    await prisma.investmentPlan.create({
      data: {
        name: plan.name,
        durationDays: plan.durationDays,
        minGoldGram: plan.minGoldGram,
        interestRateType: plan.interestRateType,
        rate: plan.rate,
        active: plan.active,
      },
    })
  }
  console.log('✅ Investment plans seeded')

  // Coin & Bar Products — وزن‌های واقعی بازار (PENDING BUSINESS DECISION - اجرت dev defaults)
  const coinProducts = [
    {
      code: 'COIN_BAHAR_FULL',
      name: 'سکه بهار آزادی',
      kind: 'COIN',
      weightGrams: 8.133,
      premiumToman: 4_000_000,
      sortOrder: 1,
    },
    {
      code: 'COIN_BAHAR_HALF',
      name: 'نیم سکه بهار آزادی',
      kind: 'COIN',
      weightGrams: 4.0665,
      premiumToman: 2_500_000,
      sortOrder: 2,
    },
    {
      code: 'COIN_BAHAR_QUARTER',
      name: 'ربع سکه بهار آزادی',
      kind: 'COIN',
      weightGrams: 2.03325,
      premiumToman: 1_800_000,
      sortOrder: 3,
    },
    {
      code: 'COIN_GRAM',
      name: 'سکه گرمی',
      kind: 'COIN',
      weightGrams: 1.0166,
      premiumToman: 1_200_000,
      sortOrder: 4,
    },
    {
      code: 'BAR_1G',
      name: 'شمش ۱ گرم',
      kind: 'BAR',
      weightGrams: 1,
      premiumToman: 600_000,
      sortOrder: 5,
    },
    {
      code: 'BAR_2G',
      name: 'شمش ۲ گرم',
      kind: 'BAR',
      weightGrams: 2,
      premiumToman: 900_000,
      sortOrder: 6,
    },
    {
      code: 'BAR_5G',
      name: 'شمش ۵ گرم',
      kind: 'BAR',
      weightGrams: 5,
      premiumToman: 1_800_000,
      sortOrder: 7,
    },
    {
      code: 'BAR_10G',
      name: 'شمش ۱۰ گرم',
      kind: 'BAR',
      weightGrams: 10,
      premiumToman: 3_000_000,
      sortOrder: 8,
    },
    {
      code: 'BAR_20G',
      name: 'شمش ۲۰ گرم',
      kind: 'BAR',
      weightGrams: 20,
      premiumToman: 5_000_000,
      sortOrder: 9,
    },
  ]

  for (const p of coinProducts) {
    await prisma.coinProduct.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        weightGrams: p.weightGrams,
        premiumToman: p.premiumToman,
        sortOrder: p.sortOrder,
        active: true,
      },
      create: { ...p, active: true },
    })
  }
  console.log('✅ Coin products seeded')

  // Notification Templates
  const notificationTemplates = [
    {
      key: 'otp',
      channels: ['SMS'],
      titleTemplate: 'کد تایید زرسی',
      bodyTemplate: 'کد تایید شما: {code}',
      variables: { code: '' },
    },
    {
      key: 'login_alert',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'ورود به حساب زرسی',
      bodyTemplate: 'ورود جدید از {device} در {time}',
      variables: { device: '', time: '' },
    },
    {
      key: 'buy_success',
      channels: ['PUSH', 'IN_APP'],
      titleTemplate: 'خرید موفق',
      bodyTemplate: 'شما {amount} گرم طلا خریداری کردید',
      variables: { amount: '' },
    },
    {
      key: 'sell_success',
      channels: ['PUSH', 'IN_APP'],
      titleTemplate: 'فروش موفق',
      bodyTemplate: 'شما {amount} گرم طلا فروختید',
      variables: { amount: '' },
    },
    {
      key: 'deposit_success',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'شارژ موفق',
      bodyTemplate: 'حساب شما {amount} تومان شارژ شد',
      variables: { amount: '' },
    },
    {
      key: 'withdrawal_pending',
      channels: ['PUSH'],
      titleTemplate: 'درخواست برداشت',
      bodyTemplate: 'درخواست برداشت {amount} تومان شما ثبت شد',
      variables: { amount: '' },
    },
    {
      key: 'withdrawal_paid',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'برداشت موفق',
      bodyTemplate: 'مبلغ {amount} تومان به حساب شما واریز شد',
      variables: { amount: '' },
    },
    {
      key: 'kyc_approved',
      channels: ['PUSH'],
      titleTemplate: 'احراز هویت تایید شد',
      bodyTemplate: 'سطح {level} احراز هویت شما تایید شد',
      variables: { level: '' },
    },
    {
      key: 'kyc_rejected',
      channels: ['PUSH'],
      titleTemplate: 'احراز هویت رد شد',
      bodyTemplate: 'دلیل: {reason}',
      variables: { reason: '' },
    },
    {
      key: 'installment_reminder',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'یادآوری قسط',
      bodyTemplate: 'قسط {number} سررسید است',
      variables: { number: '' },
    },
    {
      key: 'interest_paid',
      channels: ['PUSH'],
      titleTemplate: 'سود پرداخت شد',
      bodyTemplate: 'مبلغ {amount} گرم طلا به حساب شما اضافه شد',
      variables: { amount: '' },
    },
    {
      key: 'referral_qualified',
      channels: ['PUSH'],
      titleTemplate: 'دعوت موفق',
      bodyTemplate: 'دعوت شما فعال شد و پاداش دریافت کردید',
      variables: {},
    },
    {
      key: 'ticket_reply',
      channels: ['PUSH'],
      titleTemplate: 'پاسخ به تیکت',
      bodyTemplate: 'به تیکت شما پاسخ داده شد',
      variables: {},
    },
    {
      key: 'price_alert',
      channels: ['PUSH'],
      titleTemplate: 'هشدار قیمت',
      bodyTemplate: 'قیمت طلا به {price} رسید',
      variables: { price: '' },
    },
    {
      key: 'security_alert',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'هشدار امنیتی',
      bodyTemplate: 'فعالیت مشکوک در حساب شما',
      variables: {},
    },
  ]

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        key: template.key,
        channels: template.channels,
        titleTemplate: template.titleTemplate,
        bodyTemplate: template.bodyTemplate,
        variables: template.variables,
      },
    })
  }
  console.log('✅ Notification templates seeded')

  // Test User (Development only)
  const bcrypt = await import('bcryptjs')
  const testPassword = await bcrypt.hash('Test@1234' + process.env.PASSWORD_PEPPER, 12)

  const testUser = await prisma.user.upsert({
    where: { mobile: '09123456789' },
    update: { mobileVerifiedAt: new Date() },
    create: {
      mobile: '09123456789',
      passwordHash: testPassword,
      kycLevel: 'LEVEL_1',
      mobileVerifiedAt: new Date(),
      referralCode: 'ZAR301',
    },
  })

  // Create Wallet + Asset Accounts for test user
  await prisma.wallet.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      assetAccounts: {
        create: [
          { assetType: 'TOMAN', balance: 1000000, lockedBalance: 0 },
          { assetType: 'GOLD', balance: 0, lockedBalance: 0 },
        ],
      },
    },
  })
  console.log('✅ Test user + wallet + asset accounts seeded')

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
