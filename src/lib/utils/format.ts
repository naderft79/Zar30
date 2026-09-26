// ============================================
// Zar30 - Financial Number Formatting
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

// مبلغ تومانی/تومانی با واحد
export function formatToman(value: number | string, options?: { digits?: 'fa' | 'en' }): string {
  return `${formatAmount(value, options)} تومان`
}

// ============================================
// قانون نمایش گرم طلا — PERMANENT PROJECT RULE (AGENTS.md §12)
// ============================================
// حداکثر ۵ رقم اعشار — همیشه truncate، هرگز رند.
// دقت ذخیره‌سازی در DB هشت رقم است (GOLD_DECIMALS=8)؛ این قانون
// فقط لایه نمایش را محدود می‌کند و به محاسبات/ledger دست نمی‌زند.
// هر نمایش گرم طلا در کل پروژه (پنل کاربر، ادمین، پیام‌ها) باید از
// formatGoldAmount / formatGoldGrams استفاده کند — نه toFixed و نه toLocaleString.
export const GOLD_DISPLAY_DECIMALS = 5

// مقدار طلا به گرم — truncate به حداکثر ۵ رقم اعشار، بدون رند، بدون واهدار
export function formatGoldAmount(
  value: string | number | bigint,
  options: { digits?: 'fa' | 'en' } = {},
): string {
  const { digits = 'fa' } = options
  const invalid = digits === 'fa' ? '۰' : '0'

  // ورودی number → رشته اعشاری کامل (toLocaleString هرگز نماد علمی تولید نمی‌کند)
  let raw: string
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return invalid
    raw = value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
  } else {
    raw = String(value).trim()
  }
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) return invalid

  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const dotIndex = unsigned.indexOf('.')
  const intPart = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex)
  const fracPart = dotIndex === -1 ? '' : unsigned.slice(dotIndex + 1)

  // truncate به حداکثر ۵ رقم — صفرهای انتهایی حذف می‌شوند (۱٫۵ نه ۱٫۵۰۰۰۰)
  const frac = fracPart.slice(0, GOLD_DISPLAY_DECIMALS).replace(/0+$/, '')

  const int = intPart.replace(/^0+(?=\d)/, '')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const body = `${negative ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`
  return digits === 'fa' ? toPersianDigits(body) : body
}

// وزن طلا با واحد — نمونه: «۶٫۲۶۱۹۴ گرم»
export function formatGoldGrams(
  value: string | number | bigint,
  options?: { digits?: 'fa' | 'en' },
): string {
  return `${formatGoldAmount(value, options)} گرم`
}

// مقدار مالی دقیق — برای string/bigint هیچ Number conversion و هیچ round/truncate
// فقط نمایش: grouping سه‌رقمی + حذف اختیاری صفرهای انتهایی اعشار
export function formatExactAmount(
  value: string | bigint,
  options: { digits?: 'fa' | 'en'; trimTrailingZeros?: boolean } = {},
): string {
  const { digits = 'fa', trimTrailingZeros = true } = options
  const invalid = digits === 'fa' ? '۰' : '0'

  const raw = String(value).trim()
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) return invalid

  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const dotIndex = unsigned.indexOf('.')
  const intPart = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex)
  const fracPart = dotIndex === -1 ? '' : unsigned.slice(dotIndex + 1)

  // leading zeros → یک صفر؛ مثلاً «۰۰۷» → «۷»
  const int = intPart.replace(/^0+(?=\d)/, '')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  let frac = fracPart ?? ''
  if (trimTrailingZeros) frac = frac.replace(/0+$/, '')

  const body = `${negative ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`
  return digits === 'fa' ? toPersianDigits(body) : body
}

// عدد به حروف فارسی — فقط نمایش؛ مثال: ۴۸۳٬۵۲۱٬۰۰۰ →
// «چهارصد و هشتاد و سه میلیون و پانصد و بیست و یک هزار»
const WORD_ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const WORD_TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
]
const WORD_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const WORD_HUNDREDS = [
  '',
  'یکصد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
]
const WORD_SCALES = ['', ' هزار', ' میلیون', ' میلیارد', ' بیلیون', ' تریلیون']

function threeDigitWords(n: number): string {
  const parts: string[] = []
  const h = Math.floor(n / 100)
  const rem = n % 100
  if (h) parts.push(WORD_HUNDREDS[h]!)
  if (rem >= 20) {
    parts.push(WORD_TENS[Math.floor(rem / 10)]!)
    if (rem % 10) parts.push(WORD_ONES[rem % 10]!)
  } else if (rem >= 10) {
    parts.push(WORD_TEENS[rem - 10]!)
  } else if (rem > 0) {
    parts.push(WORD_ONES[rem]!)
  }
  return parts.join(' و ')
}

export function toPersianWords(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) return ''
  const abs = Math.floor(Math.abs(num))
  if (abs === 0) return 'صفر'

  const groups: string[] = []
  let rest = abs
  let scale = 0
  while (rest > 0 && scale < WORD_SCALES.length) {
    const chunk = rest % 1000
    if (chunk > 0) groups.unshift(threeDigitWords(chunk) + WORD_SCALES[scale])
    rest = Math.floor(rest / 1000)
    scale++
  }
  return (num < 0 ? 'منفی ' : '') + groups.join(' و ')
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
