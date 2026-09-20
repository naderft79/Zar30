// ============================================
// Zar30 - Admin Date Boundary Utilities
// ============================================
// قرارداد date-only admin filters: بر مبنای UTC calendar day
// ISO datetime کامل هم پذیرفته می‌شود — بدون تغییر معنا
// ============================================

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/

/** date-only واقعی calendar یا ISO datetime معتبر */
export function isValidAdminDateInput(value: string): boolean {
  if (DATE_ONLY.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`)
    // رد تاریخ‌های غیرواقعی مثل 2026-02-31 — round-trip روز باید حفظ شود
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
  }
  return ISO_DATETIME.test(value) && !Number.isNaN(new Date(value).getTime())
}

/**
 * مرز بازه زمانی admin — date-only به ابتدا/انتهای همان روز UTC نگاشت می‌شود
 * endOfDay=false → 00:00:00.000Z | true → 23:59:59.999Z
 */
export function parseAdminDateBoundary(value: string, endOfDay: boolean): Date {
  if (DATE_ONLY.test(value)) {
    return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
  }
  return new Date(value)
}
