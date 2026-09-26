// ============================================
// Zar30 - Utility Functions
// ============================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatGoldAmount } from './format'

// ترکیب کلاس‌های Tailwind (برای shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// فرمت اعداد فارسی
export function toPersianDigits(input: number | string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
  return String(input).replace(/\d/g, (d) => persianDigits.charAt(Number(d)))
}

// فرمت مبلغ تومانی با جداکننده هزارگان
export function formatToman(amount: number | bigint): string {
  return new Intl.NumberFormat('fa-IR').format(Number(amount))
}

// فرمت وزن طلا (گرم) — حداکثر ۵ رقم اعشار، truncate (AGENTS.md §12)
export function formatGold(grams: number): string {
  return formatGoldAmount(grams)
}

// تولید کد دعوت (۸ کاراکتر)
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
