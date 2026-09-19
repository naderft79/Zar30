// ============================================
// Zarnama - Financial Number Formatting
// ============================================
// قانون: اعداد مالی همیشه از این ماژول فرمت می‌شوند —
// هیچ toLocaleString پراکنده‌ای در کامپوننت‌ها ننویسید
// ============================================

const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

// تبدیل ارقام لاتین به فارسی
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => faDigits[Number(d)] ?? d)
}

// جداکننده هزارگان + ارقام فارسی — مثال: ۱٬۲۳۴٬۵۶۷
export function formatAmount(
  value: number | string,
  options: { digits?: 'fa' | 'en'; decimals?: number } = {},
): string {
  const { digits = 'fa', decimals } = options
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) return digits === 'fa' ? '۰' : '0'

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? 20,
  })
  return digits === 'fa' ? toPersianDigits(formatted) : formatted
}

// مبلغ ریالی/تومانی با واحد
export function formatToman(value: number | string, options?: { digits?: 'fa' | 'en' }): string {
  return `${formatAmount(value, options)} تومان`
}

// وزن طلا به گرم — ۳ رقم اعشار
export function formatGoldGrams(
  value: number | string,
  options?: { digits?: 'fa' | 'en' },
): string {
  return `${formatAmount(value, { ...options, decimals: 3 })} گرم`
}

// درصد تغییر با علامت — مثال: +۲٫۳۵٪ یا −۱٫۲۰٪
export function formatPercentChange(value: number, options: { digits?: 'fa' | 'en' } = {}): string {
  const { digits = 'fa' } = options
  const abs = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const body = digits === 'fa' ? toPersianDigits(abs) : abs
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${body}٪`
}
