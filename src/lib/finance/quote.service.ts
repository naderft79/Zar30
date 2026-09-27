// ============================================
// Zar30 - Trade Quote Service (Preview Only)
// ============================================
// پیش‌نمایش معامله قبل از ثبت — کاملاً read-only
// هیچ mutation، هیچ journal، هیچ رزروی اینجا انجام نمی‌شود
// منبع قیمت: همان getExecutablePrice موتور معامله — پیش‌نمایش
// همیشه با قیمت واقعی قابل اجرا سازگار است
// ============================================

import type { KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { Decimal, tomanToGold, goldToToman } from './money'
import { getExecutablePrice } from './pricing.service'
import { calculateUserTradeFee, resolveTradeFeeBps, MIN_ORDER_TOMAN } from './fee.service'
import { ensureAssetAccount } from './wallet.service'
import { KYC_LIMITS } from './limits'
import { FinanceErrors } from './errors'

export type QuoteSide = 'BUY' | 'SELL'
export type QuoteInputType = 'TOMAN' | 'GOLD'

export interface TradeQuote {
  side: QuoteSide
  inputType: QuoteInputType
  /** ورودی کاربر به صورت رشته امن — همان که ارسال شده */
  inputAmount: string
  /** مقدار طلا حاصل/موردنیاز — رشته اعشاری تا ۸ رقم */
  goldAmount: string
  /** مبلغ تومانی ناخالص معامله (بدون کارمزد) */
  tomanAmount: string
  /** قیمت واحد اجرا — خرید: buyPrice، فروش: sellPrice */
  unitPrice: string
  /** کارمزد تومانی این کاربر (bps اختصاصی) */
  fee: string
  /** نرخ کارمزد به basis points */
  feeBps: number
  /** اسپرد فعلی بازار — Decimal رشته */
  spread: string
  /** خرید: کل پرداختی = tomanAmount + fee | فروش: خالص دریافتی = tomanAmount - fee */
  finalToman: string
  isLive: boolean
  priceUpdatedAt: string
  priceSource: string
  minOrderToman: string
  /** سقف و مصرف روزانه معامله بر اساس سطح KYC */
  dailyLimit: {
    kycLevel: KycLevel
    /** سقف تومانی روزانه — null یعنی نامحدود */
    limitToman: string | null
    usedToday: string
    remainingToman: string | null
  }
  balances: {
    tomanAvailable: string
    goldAvailable: string
  }
}

// مصرف امروز سفارش‌های FILLED از نیمه‌شب — همان منطق checkDailyLimit موتور معامله
async function usedTodayToman(userId: string): Promise<bigint> {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const used = await prisma.order.aggregate({
    where: { userId, status: 'FILLED', createdAt: { gte: dayStart } },
    _sum: { total: true },
  })
  return used._sum.total ?? 0n
}

// اعتبارسنجی ورودی عددی — بدون هیچ conversion غیرایمن
function parseTomanInput(raw: string): bigint {
  if (!/^\d+$/.test(raw) || raw.length === 0) {
    throw FinanceErrors.invalidAmount('مبلغ تومانی باید عدد صحیح مثبت باشد')
  }
  const v = BigInt(raw)
  if (v <= 0n) throw FinanceErrors.invalidAmount('مبلغ باید مثبت باشد')
  return v
}

function parseGoldInput(raw: string): Decimal {
  if (!/^\d+(\.\d{1,8})?$/.test(raw)) {
    throw FinanceErrors.invalidAmount('مقدار طلا باید عدد مثبت با حداکثر ۸ رقم اعشار باشد')
  }
  const v = new Decimal(raw)
  if (v.lte(0)) throw FinanceErrors.invalidAmount('مقدار طلا باید مثبت باشد')
  return v
}

/**
 * پیش‌نمایش معامله — فقط خواندن، بدون اثر مالی
 * محاسبات با همان helpers موتور معامله (tomanToGold/goldToToman + fee) انجام
 * می‌شود تا پیش‌نمایش با اجرای واقعی سازگار باشد.
 */
export async function getTradeQuote(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { side: QuoteSide; inputType: QuoteInputType; amount: string },
): Promise<TradeQuote> {
  const price = await getExecutablePrice()

  // موجودی‌ها — همان حساب‌های واقعی موتور معامله
  const [tomanAccount, goldAccount, resolvedFeeBps, usedToday] = await Promise.all([
    ensureAssetAccount(prisma, ctx.userId, 'TOMAN'),
    ensureAssetAccount(prisma, ctx.userId, 'GOLD'),
    resolveTradeFeeBps(ctx.userId, input.side),
    usedTodayToman(ctx.userId),
  ])

  const limit = KYC_LIMITS[ctx.kycLevel].dailyTradeToman
  const remaining = limit === null ? null : limit > usedToday ? limit - usedToday : 0n

  let goldAmount: Decimal
  let tomanAmount: bigint
  let fee: bigint

  if (input.side === 'BUY') {
    if (input.inputType === 'TOMAN') {
      tomanAmount = parseTomanInput(input.amount)
      goldAmount = tomanToGold(tomanAmount, price.buyPrice)
      if (goldAmount.lte(0)) throw FinanceErrors.invalidAmount('مبلغ برای خرید طلا کافی نیست')
    } else {
      goldAmount = parseGoldInput(input.amount)
      tomanAmount = goldToToman(goldAmount, price.buyPrice)
      if (tomanAmount <= 0n) throw FinanceErrors.invalidAmount('مقدار برای خرید کافی نیست')
    }
    fee = await calculateUserTradeFee(ctx.userId, tomanAmount, 'BUY')
  } else {
    goldAmount = parseGoldInput(input.amount)
    tomanAmount = goldToToman(goldAmount, price.sellPrice)
    if (tomanAmount <= 0n) throw FinanceErrors.invalidAmount('مقدار برای فروش کافی نیست')
    fee = await calculateUserTradeFee(ctx.userId, tomanAmount, 'SELL')
  }

  const finalToman = input.side === 'BUY' ? tomanAmount + fee : tomanAmount - fee

  return {
    side: input.side,
    inputType: input.inputType,
    inputAmount: input.amount,
    goldAmount: goldAmount.toString(),
    tomanAmount: tomanAmount.toString(),
    unitPrice: (input.side === 'BUY' ? price.buyPrice : price.sellPrice).toString(),
    fee: fee.toString(),
    feeBps: Number(resolvedFeeBps),
    spread: price.spread.toString(),
    finalToman: finalToman.toString(),
    isLive: Date.now() - price.recordedAt.getTime() <= 60_000,
    priceUpdatedAt: price.recordedAt.toISOString(),
    priceSource: price.source,
    minOrderToman: MIN_ORDER_TOMAN.toString(),
    dailyLimit: {
      kycLevel: ctx.kycLevel,
      limitToman: limit === null ? null : limit.toString(),
      usedToday: usedToday.toString(),
      remainingToman: remaining === null ? null : remaining.toString(),
    },
    balances: {
      tomanAvailable: new Decimal(tomanAccount.balance).toString(),
      goldAvailable: new Decimal(goldAccount.balance).toString(),
    },
  }
}
