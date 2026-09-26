// ============================================
// Zar30 - Validators v2 Unit Test
// ============================================
// پوشش validatorهای بدون تست: auth، finance، admin (ops/risk/system/
// delivery/commerce/automation) — قرارداد ورودی APIهای حساس
// ============================================

import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../../src/lib/validators/auth'
import {
  createOrderSchema,
  createDepositSchema,
  createWithdrawalSchema,
  adminRecordPriceSchema,
} from '../../src/lib/validators/finance'
import {
  adminBankAccountListQuerySchema,
  adminTransferListQuerySchema,
  adminFlagSchema,
  adminBlockCardSchema,
} from '../../src/lib/validators/admin-ops'
import {
  adminRiskRuleSchema,
  adminRiskEventsQuerySchema,
  adminExportSchema,
  adminJournalQuerySchema,
} from '../../src/lib/validators/admin-risk'
import {
  adminBroadcastSchema,
  adminNotificationTemplateSchema,
  adminMemberUpdateSchema,
  adminSettingSchema,
  adminSeoSchema,
} from '../../src/lib/validators/admin-system'
import {
  adminDeliveryListQuerySchema,
  adminDeliveryReviewSchema,
  adminDeliveryShipSchema,
  adminDeliverySettingsSchema,
} from '../../src/lib/validators/admin-delivery'
import {
  adminProductSchema,
  adminCategorySchema,
  adminDiscountSchema,
  adminFeeRuleSchema,
  adminLimitRuleSchema,
} from '../../src/lib/validators/admin-commerce'
import {
  adminSipToggleSchema,
  adminRateLimitSchema,
  adminAlertListQuerySchema,
} from '../../src/lib/validators/admin-automation'

const MOBILE = '09123456789'
const PASSWORD = 'Str0ng!Pass'

describe('Auth Validators', () => {
  it('register — موبایل ایرانی + پسورد قوی + کد دعوت اختیاری', () => {
    expect(registerSchema.safeParse({ mobile: MOBILE, password: PASSWORD }).success).toBe(true)
    expect(
      registerSchema.safeParse({ mobile: MOBILE, password: PASSWORD, referralCode: 'ABCD2345' })
        .success,
    ).toBe(true)
    expect(registerSchema.safeParse({ mobile: '123', password: PASSWORD }).success).toBe(false)
    expect(registerSchema.safeParse({ mobile: MOBILE, password: 'weak' }).success).toBe(false)
    // کد دعوت باید base32 هشت‌رقمی باشد
    expect(
      registerSchema.safeParse({ mobile: MOBILE, password: PASSWORD, referralCode: 'bad!' })
        .success,
    ).toBe(false)
  })

  it('otp send/verify — purpose محدود و کد عددی', () => {
    expect(otpSendSchema.safeParse({ mobile: MOBILE, purpose: 'register' }).success).toBe(true)
    expect(otpSendSchema.safeParse({ mobile: MOBILE, purpose: 'hack' }).success).toBe(false)
    expect(
      otpVerifySchema.safeParse({ mobile: MOBILE, purpose: 'login', code: '123456' }).success,
    ).toBe(true)
    expect(
      otpVerifySchema.safeParse({ mobile: MOBILE, purpose: 'login', code: 'abc' }).success,
    ).toBe(false)
  })

  it('login/reset/change password', () => {
    expect(loginSchema.safeParse({ mobile: MOBILE, password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ mobile: MOBILE }).success).toBe(false)
    expect(
      resetPasswordSchema.safeParse({ mobile: MOBILE, code: '123456', password: PASSWORD }).success,
    ).toBe(true)
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: PASSWORD }).success,
    ).toBe(true)
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '123' }).success,
    ).toBe(false)
  })
})

describe('Finance Validators', () => {
  it('createOrder — خرید به tomanAmount و فروش به goldAmount نیاز دارد', () => {
    expect(createOrderSchema.safeParse({ type: 'BUY', tomanAmount: '50000' }).success).toBe(true)
    expect(createOrderSchema.safeParse({ type: 'BUY', goldAmount: '1' }).success).toBe(false)
    expect(createOrderSchema.safeParse({ type: 'SELL', goldAmount: '0.5' }).success).toBe(true)
    expect(createOrderSchema.safeParse({ type: 'SELL', tomanAmount: '50000' }).success).toBe(false)
    // مبلغ منفی/صفر رد می‌شود
    expect(createOrderSchema.safeParse({ type: 'BUY', tomanAmount: '0' }).success).toBe(false)
    expect(createOrderSchema.safeParse({ type: 'BUY', tomanAmount: '-5' }).success).toBe(false)
  })

  it('createWithdrawal — iban یا bankAccountId الزامی + otpCode', () => {
    const ok = createWithdrawalSchema.safeParse({
      amount: '10000',
      bankAccountId: crypto.randomUUID(),
      otpCode: '123456',
    })
    expect(ok.success).toBe(true)
    expect(createWithdrawalSchema.safeParse({ amount: '10000', otpCode: '123456' }).success).toBe(
      false,
    )
    expect(
      createWithdrawalSchema.safeParse({
        amount: '10000',
        bankAccountId: crypto.randomUUID(),
        otpCode: 'x',
      }).success,
    ).toBe(false)
  })

  it('createDeposit + adminRecordPrice', () => {
    expect(createDepositSchema.safeParse({ amount: '1000' }).success).toBe(true)
    expect(createDepositSchema.safeParse({ amount: 'abc' }).success).toBe(false)
    expect(adminRecordPriceSchema.safeParse({ buyPrice: '100', sellPrice: '99' }).success).toBe(
      true,
    )
  })
})

describe('Admin Ops Validators', () => {
  it('queryها — pagination coerce + بازه زمانی معتبر', () => {
    const ok = adminTransferListQuerySchema.safeParse({ page: '2', limit: '10' })
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.data.page).toBe(2)
      expect(ok.data.direction).toBe('desc')
    }
    // from بعد از to → reject
    expect(
      adminTransferListQuerySchema.safeParse({ from: '2025-12-01', to: '2025-01-01' }).success,
    ).toBe(false)
    expect(adminBankAccountListQuerySchema.safeParse({ blocked: 'true' }).success).toBe(true)
  })

  it('flag/block — دلیل حداقل ۳ کاراکتر', () => {
    expect(adminFlagSchema.safeParse({ reason: 'مشکوک' }).success).toBe(true)
    expect(adminFlagSchema.safeParse({ reason: 'ab' }).success).toBe(false)
    expect(adminBlockCardSchema.safeParse({ reason: 'گزارش کلاهبرداری' }).success).toBe(true)
  })
})

describe('Admin Risk Validators', () => {
  it('riskRule — metric enum + آستانه مثبت', () => {
    const ok = adminRiskRuleSchema.safeParse({
      name: 'سقف برداشت',
      metric: 'WITHDRAW_SUM',
      threshold: 100,
    })
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.data.windowHours).toBe(24)
      expect(ok.data.scoreWeight).toBe(10)
    }
    expect(
      adminRiskRuleSchema.safeParse({ name: 'x', metric: 'BOGUS', threshold: 1 }).success,
    ).toBe(false)
    expect(
      adminRiskRuleSchema.safeParse({ name: 'قانون', metric: 'TRADE_SUM', threshold: -5 }).success,
    ).toBe(false)
  })

  it('events/export/journal queries', () => {
    expect(adminRiskEventsQuerySchema.safeParse({ status: 'open', minScore: '50' }).success).toBe(
      true,
    )
    expect(adminRiskEventsQuerySchema.safeParse({ status: 'closed' }).success).toBe(false)
    expect(adminExportSchema.safeParse({ kind: 'orders' }).success).toBe(true)
    expect(adminExportSchema.safeParse({ kind: 'secrets' }).success).toBe(false)
    expect(adminJournalQuerySchema.safeParse({ status: 'POSTED' }).success).toBe(true)
  })
})

describe('Admin System Validators', () => {
  it('broadcast + template + member + setting + seo', () => {
    expect(adminBroadcastSchema.safeParse({ title: 'اعلان', body: 'متن اعلان' }).success).toBe(true)
    expect(adminBroadcastSchema.safeParse({ title: 'a', body: 'b' }).success).toBe(false)

    expect(
      adminNotificationTemplateSchema.safeParse({
        key: 'order.filled',
        channels: ['IN_APP', 'PUSH'],
        titleTemplate: 'سفارش ثبت شد',
        bodyTemplate: 'سفارش شما انجام شد',
      }).success,
    ).toBe(true)
    // کلید uppercase ممنوع
    expect(
      adminNotificationTemplateSchema.safeParse({
        key: 'Order.Filled',
        channels: ['IN_APP'],
        titleTemplate: 'تیتر',
        bodyTemplate: 'متن',
      }).success,
    ).toBe(false)

    expect(adminMemberUpdateSchema.safeParse({ role: 'SUPPORT', reason: 'چرخش تیم' }).success).toBe(
      true,
    )
    // نقش نامعتبر رد می‌شود
    expect(adminMemberUpdateSchema.safeParse({ role: 'GOD', reason: 'تست دلیل' }).success).toBe(
      false,
    )
    // reason الزامی است حتی برای تغییر active
    expect(adminMemberUpdateSchema.safeParse({ active: false }).success).toBe(false)

    expect(adminSettingSchema.safeParse({ key: 'delivery.config', value: {} }).success).toBe(true)
    expect(adminSettingSchema.safeParse({ key: 'BAD KEY!', value: 1 }).success).toBe(false)

    expect(adminSeoSchema.safeParse({ page: '/', title: 'زرسی' }).success).toBe(true)
    expect(adminSeoSchema.safeParse({ page: 'bad space', title: 'تیتر' }).success).toBe(false)
  })
})

describe('Admin Delivery Validators', () => {
  it('list query — status/method enum + بازه زمانی', () => {
    expect(
      adminDeliveryListQuerySchema.safeParse({ status: 'PENDING', method: 'POST' }).success,
    ).toBe(true)
    expect(adminDeliveryListQuerySchema.safeParse({ status: 'LOST' }).success).toBe(false)
    expect(
      adminDeliveryListQuerySchema.safeParse({ from: '2025-06-01', to: '2025-01-01' }).success,
    ).toBe(false)
  })

  it('ship — trackingCode یا pickupBranch+pickupAt لازم است', () => {
    expect(adminDeliveryShipSchema.safeParse({ trackingCode: 'TRK12345' }).success).toBe(true)
    expect(
      adminDeliveryShipSchema.safeParse({
        pickupBranch: 'شعبه ۱',
        pickupAt: new Date().toISOString(),
      }).success,
    ).toBe(true)
    expect(adminDeliveryShipSchema.safeParse({}).success).toBe(false)
    // فقط شعبه بدون زمان کافی نیست
    expect(adminDeliveryShipSchema.safeParse({ pickupBranch: 'شعبه ۱' }).success).toBe(false)
  })

  it('review + settings', () => {
    expect(adminDeliveryReviewSchema.safeParse({ action: 'approve' }).success).toBe(true)
    expect(adminDeliveryReviewSchema.safeParse({ action: 'explode' }).success).toBe(false)
    expect(
      adminDeliverySettingsSchema.safeParse({ feePost: '5000', feePickup: '0', minGrams: '0.5' })
        .success,
    ).toBe(true)
    expect(
      adminDeliverySettingsSchema.safeParse({ feePost: '-1', feePickup: '0', minGrams: '0.5' })
        .success,
    ).toBe(false)
  })
})

describe('Admin Commerce Validators', () => {
  it('product + category', () => {
    expect(
      adminProductSchema.safeParse({
        sku: 'COIN-1G',
        name: 'سکه یک گرمی',
        kind: 'COIN',
        weightGrams: '1.000000',
        premiumToman: '50000',
        stock: '10',
      }).success,
    ).toBe(true)
    expect(
      adminProductSchema.safeParse({
        sku: 'X',
        name: 'سکه',
        kind: 'COIN',
        weightGrams: 'abc',
        premiumToman: '5',
        stock: '1',
      }).success,
    ).toBe(false)
    expect(adminCategorySchema.safeParse({ name: 'سکه', slug: 'coin-1' }).success).toBe(true)
    expect(adminCategorySchema.safeParse({ name: 'سکه', slug: 'Bad Slug' }).success).toBe(false)
  })

  it('discount — PERCENT باید ۱ تا ۱۰۰ باشد', () => {
    expect(
      adminDiscountSchema.safeParse({
        code: 'OFF10',
        type: 'PERCENT',
        value: '10',
        appliesTo: 'TRADE_FEE',
      }).success,
    ).toBe(true)
    expect(
      adminDiscountSchema.safeParse({
        code: 'OFF200',
        type: 'PERCENT',
        value: '200',
        appliesTo: 'TRADE_FEE',
      }).success,
    ).toBe(false)
    expect(
      adminDiscountSchema.safeParse({
        code: 'FIXED5K',
        type: 'FIXED',
        value: '5000',
        appliesTo: 'SHOP',
      }).success,
    ).toBe(true)
  })

  it('feeRule — KYC_LEVEL نیازمند سطح؛ VOLUME نیازمند minVolume', () => {
    expect(
      adminFeeRuleSchema.safeParse({
        name: 'قانون KYC',
        kind: 'KYC_LEVEL',
        kycLevel: 'LEVEL_2',
        buyFeeBps: 50,
        sellFeeBps: 40,
      }).success,
    ).toBe(true)
    expect(
      adminFeeRuleSchema.safeParse({
        name: 'قانون ناقص',
        kind: 'KYC_LEVEL',
        buyFeeBps: 50,
        sellFeeBps: 40,
      }).success,
    ).toBe(false)
    expect(
      adminFeeRuleSchema.safeParse({
        name: 'قانون حجمی',
        kind: 'VOLUME',
        buyFeeBps: 30,
        sellFeeBps: 20,
      }).success,
    ).toBe(false)
    // bps بیش از ۱۰۰٪ نامعتبر
    expect(
      adminFeeRuleSchema.safeParse({
        name: 'کارمزد بزرگ',
        kind: 'KYC_LEVEL',
        kycLevel: 'LEVEL_3',
        buyFeeBps: 20000,
        sellFeeBps: 10,
      }).success,
    ).toBe(false)
  })

  it('limitRule — حداقل یک سقف؛ TRANSFER فقط گرم', () => {
    expect(
      adminLimitRuleSchema.safeParse({
        scope: 'WITHDRAW',
        period: 'DAILY',
        amountToman: '1000000',
      }).success,
    ).toBe(true)
    expect(adminLimitRuleSchema.safeParse({ scope: 'TRADE', period: 'DAILY' }).success).toBe(false)
    // TRANSFER بدون amountGold رد می‌شود
    expect(
      adminLimitRuleSchema.safeParse({
        scope: 'TRANSFER',
        period: 'DAILY',
        amountToman: '1000',
      }).success,
    ).toBe(false)
    expect(
      adminLimitRuleSchema.safeParse({ scope: 'TRANSFER', period: 'DAILY', amountGold: '5' })
        .success,
    ).toBe(true)
  })
})

describe('Admin Automation Validators', () => {
  it('sip toggle + rateLimit + alerts query', () => {
    expect(adminSipToggleSchema.safeParse({ active: false }).success).toBe(true)
    expect(adminSipToggleSchema.safeParse({}).success).toBe(false)

    expect(
      adminRateLimitSchema.safeParse({
        key: 'otp.send',
        limit: '5',
        windowSeconds: '3600',
        scope: 'MOBILE',
      }).success,
    ).toBe(true)
    expect(
      adminRateLimitSchema.safeParse({ key: 'BAD KEY', limit: 1, windowSeconds: 1, scope: 'IP' })
        .success,
    ).toBe(false)
    // windowSeconds بیش از یک روز
    expect(
      adminRateLimitSchema.safeParse({
        key: 'api.general',
        limit: 1,
        windowSeconds: 100000,
        scope: 'IP',
      }).success,
    ).toBe(false)

    expect(
      adminAlertListQuerySchema.safeParse({ alertDirection: 'ABOVE', status: 'active' }).success,
    ).toBe(true)
    expect(adminAlertListQuerySchema.safeParse({ status: 'weird' }).success).toBe(false)
  })
})
