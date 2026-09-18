// ============================================
// Zarnama - Database Seed (Development Only)
// ============================================
// این فایل فقط برای محیط development استفاده می‌شود
// Seed data باید واضحاً از production data جدا باشد
// ============================================

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Ledger Accounts (Double-Entry Accounting)
  const ledgerAccounts = [
    // Asset Accounts (دارایی‌های کاربران)
    { code: 'ASSET_RIAL', type: 'ASSET', name: 'Rial Balance', assetType: 'RIAL' },
    { code: 'ASSET_GOLD', type: 'ASSET', name: 'Gold Balance', assetType: 'GOLD' },
    { code: 'ASSET_LOCKED_RIAL', type: 'ASSET', name: 'Locked Rial', assetType: 'RIAL' },
    { code: 'ASSET_LOCKED_GOLD', type: 'ASSET', name: 'Locked Gold', assetType: 'GOLD' },

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
        type: account.type as any,
        name: account.name,
        assetType: account.assetType as any,
      },
    })
  }
  console.log('✅ Ledger accounts seeded')

  // Rate Limit Configs (Configurable)
  const rateLimits = [
    { key: 'api.general', limit: 100, windowSeconds: 60, scope: 'IP' },
    { key: 'otp.send', limit: 5, windowSeconds: 3600, scope: 'MOBILE' },
    { key: 'auth.login', limit: 10, windowSeconds: 3600, scope: 'MOBILE' },
    { key: 'trading.execute', limit: 30, windowSeconds: 60, scope: 'USER' },
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
        scope: config.scope as any,
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

  // Installment Plans (PENDING BUSINESS DECISION - dev defaults)
  const installmentPlans = [
    {
      name: 'طرح ۱۲ ماهه',
      months: 12,
      downPaymentPercent: 20,
      interestRate: 10,
      fee: 2,
      minAmount: 5000000,
      maxAmount: 500000000,
      active: true,
    },
    {
      name: 'طرح ۱۸ ماهه',
      months: 18,
      downPaymentPercent: 30,
      interestRate: 12,
      fee: 2,
      minAmount: 5000000,
      maxAmount: 1000000000,
      active: true,
    },
    {
      name: 'طرح ۲۴ ماهه',
      months: 24,
      downPaymentPercent: 40,
      interestRate: 15,
      fee: 2,
      minAmount: 10000000,
      maxAmount: 2000000000,
      active: true,
    },
  ]

  for (const plan of installmentPlans) {
    await prisma.installmentPlan.create({
      data: {
        name: plan.name,
        months: plan.months,
        downPaymentPercent: plan.downPaymentPercent,
        interestRate: plan.interestRate,
        fee: plan.fee,
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
        active: plan.active,
      },
    })
  }
  console.log('✅ Installment plans seeded')

  // Investment Plans (PENDING BUSINESS DECISION - dev defaults)
  const investmentPlans = [
    {
      name: 'طرح سوددهی ماهانه',
      durationDays: 30,
      minGoldGram: 0.1,
      interestRateType: 'FIXED' as const,
      rate: 1.5,
      active: true,
    },
    {
      name: 'طرح سوددهی فصلی',
      durationDays: 90,
      minGoldGram: 1,
      interestRateType: 'FIXED' as const,
      rate: 5,
      active: true,
    },
    {
      name: 'طرح سوددهی سالانه',
      durationDays: 365,
      minGoldGram: 5,
      interestRateType: 'FIXED' as const,
      rate: 18,
      active: true,
    },
  ]

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

  // Notification Templates
  const notificationTemplates = [
    {
      key: 'otp',
      channels: ['SMS'],
      titleTemplate: 'کد تایید زرنما',
      bodyTemplate: 'کد تایید شما: {code}',
      variables: { code: '' },
    },
    {
      key: 'login_alert',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'ورود به حساب زرنما',
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
      bodyTemplate: 'حساب شما {amount} ریال شارژ شد',
      variables: { amount: '' },
    },
    {
      key: 'withdrawal_pending',
      channels: ['PUSH'],
      titleTemplate: 'درخواست برداشت',
      bodyTemplate: 'درخواست برداشت {amount} ریال شما ثبت شد',
      variables: { amount: '' },
    },
    {
      key: 'withdrawal_paid',
      channels: ['PUSH', 'SMS'],
      titleTemplate: 'برداشت موفق',
      bodyTemplate: 'مبلغ {amount} ریال به حساب شما واریز شد',
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
    update: {},
    create: {
      mobile: '09123456789',
      passwordHash: testPassword,
      pepper: process.env.PASSWORD_PEPPER || 'dev_pepper',
      kycLevel: 'LEVEL_1',
      referralCode: 'ZARNAMA1',
    },
  })

  // Create Wallet + Asset Accounts for test user
  const wallet = await prisma.wallet.create({
    data: {
      userId: testUser.id,
      assetAccounts: {
        create: [
          { assetType: 'RIAL', balance: 10000000, lockedBalance: 0 },
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
