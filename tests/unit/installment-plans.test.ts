// ============================================
// Unit Tests — Installment Plans & Quote Calculation
// ============================================
import { describe, expect, it } from 'vitest'
import {
  INSTALLMENT_PLANS,
  INSTALLMENT_MIN_AMOUNT,
  INSTALLMENT_BUY_FEE_RATE,
  INSTALLMENT_GATEWAY_FEE_RATE,
  INSTALLMENT_ANNUAL_RATE,
  getInstallmentPlan,
  computeInstallmentQuote,
} from '../../src/lib/installments/plans'
import { INSTALLMENT_TERMS } from '../../src/lib/data/installment-terms'

describe('Installment Plans', () => {
  it('getInstallmentPlan — طرح معتبر برمی‌گردد و نامعتبر undefined', () => {
    expect(getInstallmentPlan(3)?.months).toBe(3)
    expect(getInstallmentPlan(6)?.months).toBe(6)
    expect(getInstallmentPlan(12)?.months).toBe(12)
    expect(getInstallmentPlan(18)?.months).toBe(18)
    expect(getInstallmentPlan(4)).toBeUndefined()
    expect(getInstallmentPlan(0)).toBeUndefined()
  })

  it('computeInstallmentQuote — مبلغ کمتر از حداقل null است', () => {
    expect(computeInstallmentQuote(INSTALLMENT_MIN_AMOUNT - 1, 3)).toBeNull()
    expect(computeInstallmentQuote(INSTALLMENT_MIN_AMOUNT, 3)).not.toBeNull()
  })

  it('computeInstallmentQuote — مبلغ بیشتر از سقف طرح null است', () => {
    const plan = getInstallmentPlan(3)!
    expect(computeInstallmentQuote(plan.maxAmount + 1, 3)).toBeNull()
    expect(computeInstallmentQuote(plan.maxAmount, 3)).not.toBeNull()
  })

  it('computeInstallmentQuote — طرح نامعتبر یا مبلغ نامعتبر null است', () => {
    expect(computeInstallmentQuote(50_000_000, 7)).toBeNull()
    expect(computeInstallmentQuote(Number.NaN, 3)).toBeNull()
    expect(computeInstallmentQuote(Infinity, 3)).toBeNull()
  })

  it('computeInstallmentQuote — محاسبه annuity و کارمزدها صحیح است', () => {
    const amount = 100_000_000
    const quote = computeInstallmentQuote(amount, 3)!
    const plan = getInstallmentPlan(3)!

    // annuity: A = P·r·(1+r)^n / ((1+r)^n − 1)
    const r = INSTALLMENT_ANNUAL_RATE / 12
    const f = Math.pow(1 + r, 3)
    const expectedInstallment = (amount * r * f) / (f - 1)
    expect(quote.installment).toBeCloseTo(expectedInstallment, 6)
    expect(quote.total).toBeCloseTo(expectedInstallment * 3, 6)

    // کارمزدها — مقیاس‌پذیر به نسبت اعتبار
    expect(quote.serviceFee).toBe(Math.round((amount / 10_000_000) * plan.serviceFeePer10M))
    expect(quote.buyFee).toBe(Math.round(amount * INSTALLMENT_BUY_FEE_RATE))
    expect(quote.gatewayFee).toBe(Math.round(amount * INSTALLMENT_GATEWAY_FEE_RATE))
    expect(quote.payable).toBe(quote.serviceFee + quote.buyFee + quote.gatewayFee)
  })

  it('computeInstallmentQuote — سود مثبت است (total > amount)', () => {
    for (const plan of INSTALLMENT_PLANS) {
      const quote = computeInstallmentQuote(INSTALLMENT_MIN_AMOUNT, plan.months)!
      expect(quote.total).toBeGreaterThan(INSTALLMENT_MIN_AMOUNT)
      expect(quote.installment).toBeGreaterThan(0)
    }
  })

  it('INSTALLMENT_TERMS — متن حقوقی خالی نیست و به زرسی ارجاع می‌دهد', () => {
    expect(INSTALLMENT_TERMS.length).toBeGreaterThan(5)
    expect(INSTALLMENT_TERMS[0]).toContain('زرسی')
  })
})
