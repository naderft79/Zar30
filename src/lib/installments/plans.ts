// ============================================
// Zar30 - Installment Plans & Quote Calculation
// ============================================
// منبع واحد قواعد طرح‌های اقساطی — هم کلاینت (preview) هم سرور
// مقادیر نهایی بعداً از پنل ادمین تغذیه می‌شوند
// ============================================

export interface InstallmentPlan {
  months: number
  /** سقف اعتبار این طرح — تومان */
  maxAmount: number
  /** هزینه خدمات به ازای هر ۱۰ میلیون تومان اعتبار — تومان */
  serviceFeePer10M: number
}

export const INSTALLMENT_PLANS: readonly InstallmentPlan[] = [
  { months: 3, maxAmount: 100_000_000, serviceFeePer10M: 500_000 },
  { months: 6, maxAmount: 200_000_000, serviceFeePer10M: 800_000 },
  { months: 12, maxAmount: 400_000_000, serviceFeePer10M: 1_400_000 },
  { months: 18, maxAmount: 500_000_000, serviceFeePer10M: 2_100_000 },
] as const

export const INSTALLMENT_MIN_AMOUNT = 10_000_000
/** نرخ سود سالانه — فرمول قسط annuity */
export const INSTALLMENT_ANNUAL_RATE = 0.23
/** کارمزد خرید — ۰.۵٪ از اعتبار */
export const INSTALLMENT_BUY_FEE_RATE = 0.005
/** کارمزد درگاه پرداخت — ۰.۰۰۲٪ از اعتبار */
export const INSTALLMENT_GATEWAY_FEE_RATE = 0.00002

export function getInstallmentPlan(months: number): InstallmentPlan | undefined {
  return INSTALLMENT_PLANS.find((p) => p.months === months)
}

export interface InstallmentQuote {
  amount: number
  months: number
  /** قسط ماهانه — annuity */
  installment: number
  /** مجموع اقساط */
  total: number
  /** هزینه خدمات — مقیاس‌پذیر به نسبت اعتبار */
  serviceFee: number
  /** کارمزد خرید ۰.۵٪ */
  buyFee: number
  /** کارمزد درگاه ۰.۰۰۲٪ */
  gatewayFee: number
  /** مبلغ قابل پرداخت الان — هزینه خدمات + کارمزدها */
  payable: number
}

export function computeInstallmentQuote(amount: number, months: number): InstallmentQuote | null {
  const plan = getInstallmentPlan(months)
  if (!plan || !Number.isFinite(amount)) return null
  if (amount < INSTALLMENT_MIN_AMOUNT || amount > plan.maxAmount) return null

  const monthlyRate = INSTALLMENT_ANNUAL_RATE / 12
  const factor = Math.pow(1 + monthlyRate, months)
  const installment = (amount * monthlyRate * factor) / (factor - 1)
  const total = installment * months

  const serviceFee = Math.round((amount / 10_000_000) * plan.serviceFeePer10M)
  const buyFee = Math.round(amount * INSTALLMENT_BUY_FEE_RATE)
  const gatewayFee = Math.round(amount * INSTALLMENT_GATEWAY_FEE_RATE)
  const payable = serviceFee + buyFee + gatewayFee

  return { amount, months, installment, total, serviceFee, buyFee, gatewayFee, payable }
}
