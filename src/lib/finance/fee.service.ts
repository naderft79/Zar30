// ============================================
// Zar30 - Fee Engine (Centralized)
// ============================================
// محاسبه کارمزد در یک نقطه — هیچ API حق hardcode کارمزد ندارد
// پیش‌فرض ۵۰ bps (۰٫۵٪) — قابل تنظیم با TRADE_FEE_BPS
// ============================================

const TRADE_FEE_BPS = BigInt(process.env.TRADE_FEE_BPS ?? '50') // ۰٫۵٪
const BPS_BASE = 10_000n

// حداقل مبلغ سفارش — ASSUMPTION: قابل تنظیم با env
export const MIN_ORDER_RIAL = BigInt(process.env.MIN_ORDER_RIAL ?? '100000')
export const MIN_WITHDRAWAL_RIAL = BigInt(process.env.MIN_WITHDRAWAL_RIAL ?? '500000')

// کارمزد معامله — همیشه رو به پایین (ریال صحیح)
export function calculateTradeFee(rialAmount: bigint): bigint {
  if (rialAmount <= 0n) return 0n
  return (rialAmount * TRADE_FEE_BPS) / BPS_BASE
}
