// ============================================
// Zar30 - Bank/Assets Validators (Phase Assets v2)
// ============================================
// شبا با checksum واقعی مد-۹۷ (ISO 13616) — نه فقط regex
// کارت بانکی با Luhn در صورت وجود
// ============================================

import { z } from 'zod'

// ---------- IBAN checksum واقعی ----------
export function isValidIban(iban: string): boolean {
  if (!/^IR\d{24}$/.test(iban)) return false
  // ISO 13616: ۴ کاراکتر اول به انتها + تبدیل حروف به عدد → mod 97 == 1
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = 0
  for (const ch of rearranged) {
    const code = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch
    for (const d of code) remainder = (remainder * 10 + Number(d)) % 97
  }
  return remainder === 1
}

export function isValidCardPan(pan: string): boolean {
  if (!/^\d{16}$/.test(pan)) return false
  let sum = 0
  for (let i = 0; i < 16; i++) {
    let d = Number(pan[i])
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

// ---------- schemas ----------
const ibanChecked = z
  .string()
  .transform((v) => {
    // با یا بدون IR پذیرفته می‌شود — نرمال‌سازی به IR + ۲۴ رقم
    const raw = v.replace(/\s/g, '').toUpperCase()
    return raw.startsWith('IR') ? raw : `IR${raw}`
  })
  .refine(isValidIban, 'شماره شبا نامعتبر است — ارقام آن را بررسی کنید')

const mobileSchema = z.string().regex(/^09\d{9}$/, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود')

export const createBankAccountSchema = z.object({
  iban: ibanChecked,
  cardPan: z.string().refine(isValidCardPan, 'شماره کارت نامعتبر است').optional(),
  alias: z.string().max(50).optional(),
})

export const createAddressSchema = z.object({
  title: z.string().max(50).optional(),
  recipientName: z.string().min(3, 'نام گیرنده الزامی است').max(100),
  mobile: mobileSchema,
  province: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
  address: z.string().min(10, 'آدرس کامل وارد کنید').max(500),
  postalCode: z.string().regex(/^\d{10}$/, 'کد پستی باید ۱۰ رقم باشد'),
  isDefault: z.boolean().optional(),
})

const goldGrams = z
  .string()
  .regex(/^\d+(\.\d{1,6})?$/, 'مقدار طلا حداکثر ۶ رقم اعشار دارد')
  .refine((v) => Number(v) >= 1, 'حداقل ۱ گرم طلا قابل تحویل است')

export const createDeliverySchema = z.object({
  grams: goldGrams,
  method: z.enum(['POST', 'PICKUP']).default('POST'),
  addressId: z.string().uuid().optional(),
  otpCode: z
    .string()
    .regex(/^\d{4,8}$/)
    .optional(),
})

const tomanAmount = z
  .string()
  .regex(/^\d+$/, 'مبلغ باید عدد صحیح باشد')
  .transform((v) => BigInt(v))
  .refine((v) => v > 0n, 'مبلغ باید مثبت باشد')

// انتقال داخلی فقط طلاست — سیاست محصول: انتقال تومانی غیرفعال
export const createTransferSchema = z
  .object({
    recipientMobile: mobileSchema,
    assetType: z.literal('GOLD'),
    tomanAmount: tomanAmount.optional(),
    goldAmount: z
      .string()
      .regex(/^\d+(\.\d{1,6})?$/, 'مقدار طلا نامعتبر است')
      .optional(),
    kind: z.enum(['TRANSFER', 'GIFT']).default('TRANSFER'),
    giftMessage: z.string().max(200).optional(),
    otpCode: z.string().regex(/^\d{4,8}$/),
  })
  .refine((d) => !!d.goldAmount, {
    message: 'مقدار طلا (گرم) الزامی است',
  })

export const manualDepositSchema = z.object({
  amount: tomanAmount,
  trackingRef: z.string().min(4, 'شماره پیگیری/شناسه واریز الزامی است').max(50),
})

export const createPriceAlertSchema = z.object({
  targetPrice: tomanAmount,
  direction: z.enum(['ABOVE', 'BELOW']),
})

export const createSipSchema = z.object({
  tomanAmount: tomanAmount.refine((v) => v >= 100_000n, 'حداقل مبلغ پس‌انداز ۱۰۰ هزار تومان است'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
})

export const subscribeZarkarSchema = z.object({
  planId: z.string().uuid('شناسه طرح نامعتبر است'),
  goldGrams: z.string().regex(/^\d+(\.\d{1,6})?$/, 'مقدار طلا نامعتبر است'),
})

export const convertCoinSchema = z.object({
  productId: z.string().uuid('شناسه محصول نامعتبر است'),
  quantity: z.number().int('تعداد باید عدد صحیح باشد').min(1).max(20),
})
