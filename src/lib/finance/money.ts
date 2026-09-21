// ============================================
// Zar30 - Money Helpers (Financial Core)
// ============================================
// ریال: BigInt (واحد ریال — بدون اعشار)
// طلا: Decimal(18,8) — حداکثر ۸ رقم اعشار
// هرگز Number برای محاسبات مالی استفاده نمی شود
// ============================================

import { Prisma } from '@/generated/prisma'

export const Decimal = Prisma.Decimal
export type Decimal = Prisma.Decimal

export const GOLD_DECIMALS = 8
export const GOLD_UNIT = new Decimal('0.00000001')

// گرد کردن رو به پایین به ۸ رقم اعشار — کاربر هرگز بیش از حد دریافت نمی کند
export function floorGold(value: Decimal | string): Decimal {
  return new Decimal(value).toDecimalPlaces(GOLD_DECIMALS, Decimal.ROUND_FLOOR)
}

// تبدیل ریال به مقدار طلا با قیمت واحد — همیشه رو به پایین
export function rialToGold(rialAmount: bigint, unitPrice: bigint): Decimal {
  if (unitPrice <= 0n) return new Decimal(0)
  const gold = new Decimal(rialAmount.toString()).div(new Decimal(unitPrice.toString()))
  return floorGold(gold)
}

// تبدیل مقدار طلا به ریال با قیمت واحد — همیشه رو به پایین (عدد صحیح ریال)
export function goldToRial(goldAmount: Decimal, unitPrice: bigint): bigint {
  const rial = goldAmount.mul(new Decimal(unitPrice.toString()))
  return BigInt(rial.toFixed(0, Decimal.ROUND_FLOOR))
}

// تبدیل امن خروجی به JSON — BigInt و Decimal به string
export function toJsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => {
      if (typeof v === 'bigint') return v.toString()
      if (v instanceof Prisma.Decimal) return v.toString()
      return v
    }),
  )
}
