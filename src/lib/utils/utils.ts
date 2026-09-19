// ============================================
// Zar30 - Utility Functions
// ============================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ترکیب کلاس‌های Tailwind (برای shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// فرمت اعداد فارسی
export function toPersianDigits(input: number | string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
  return String(input).replace(/\d/g, (d) => persianDigits.charAt(Number(d)))
}

// فرمت مبلغ ریالی با جداکننده هزارگان
export function formatRial(amount: number | bigint): string {
  return new Intl.NumberFormat('fa-IR').format(Number(amount))
}

// فرمت وزن طلا (گرم)
export function formatGold(grams: number): string {
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(grams)
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
