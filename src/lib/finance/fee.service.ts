// ============================================
// Zar30 - Fee Engine (Centralized)
// ============================================
// محاسبه کارمزد در یک نقطه — هیچ API حق hardcode کارمزد ندارد
// پیش‌فرض ۵۰ bps (۰٫۵٪) — قابل تنظیم با TRADE_FEE_BPS
// ============================================

const TRADE_FEE_BPS = BigInt(process.env.TRADE_FEE_BPS ?? '50') // ۰٫۵٪
const BPS_BASE = 10_000n

// حداقل مبلغ سفارش — ASSUMPTION: قابل تنظیم با env
export const MIN_ORDER_TOMAN = BigInt(process.env.MIN_ORDER_TOMAN ?? '10000')
export const MIN_WITHDRAWAL_TOMAN = BigInt(process.env.MIN_WITHDRAWAL_TOMAN ?? '50000')

// کارمزد معامله — همیشه رو به پایین (تومان صحیح)
export function calculateTradeFee(tomanAmount: bigint): bigint {
  if (tomanAmount <= 0n) return 0n
  return (tomanAmount * TRADE_FEE_BPS) / BPS_BASE
}
