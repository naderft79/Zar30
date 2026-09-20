// ============================================
// Zar30 - KYC Validators (Phase 4)
// ============================================
// اعتبارسنجی واقعی: کد ملی (checksum)، شبا (mod-97)، کارت بانکی، تاریخ تولد
// این‌ها Security Boundary نیستند — server-side در service هم enforce می‌شود
// ============================================

import { z } from 'zod'

// ---- کد ملی ایران — checksum استاندارد ----
export function isValidNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false
  // همه رقم یکسان ممنوع
  if (/^(\d)\1{9}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits[9]!
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0)
  const rem = sum % 11
  return rem < 2 ? check === rem : check === 11 - rem
}

// ---- شبا IR — IBAN checksum (mod-97) ----
export function isValidIban(iban: string): boolean {
  const normalized = iban.replace(/\s/g, '').toUpperCase()
  if (!/^IR\d{24}$/.test(normalized)) return false
  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  // mod-97 روی رشته بزرگ
  let rem = 0
  for (const ch of numeric) rem = (rem * 10 + Number(ch)) % 97
  return rem === 1
}

// ---- شماره کارت ۱۶ رقم (بانک‌های ایران) ----
export function isValidCardNumber(card: string): boolean {
  return /^\d{16}$/.test(card)
}

// ---- تاریخ تولد — ۱۸ تا ۱۲۰ سال، نه آینده ----
export function isValidBirthDate(date: Date): boolean {
  const now = new Date()
  const min = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
  const max = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate())
  return date >= min && date <= max
}

// ---- Schemas ----
export const nationalCodeStrict = z
  .string()
  .regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد')
  .refine(isValidNationalCode, 'کد ملی معتبر نیست')

export const ibanStrict = z
  .string()
  .transform((v) => v.replace(/\s/g, '').toUpperCase())
  .pipe(z.string().refine(isValidIban, 'شماره شبا معتبر نیست'))

export const cardNumberSchema = z
  .string()
  .regex(/^\d{16}$/, 'شماره کارت باید ۱۶ رقم باشد')
  .refine(isValidCardNumber, 'شماره کارت معتبر نیست')

export const shenasnamehNoSchema = z
  .string()
  .regex(/^\d{1,10}$/, 'شماره شناسنامه باید حداکثر ۱۰ رقم باشد')

export const birthDateSchema = z.coerce
  .date()
  .refine(isValidBirthDate, 'تاریخ تولد معتبر نیست (حداقل ۱۸ سال)')

// مرحله ۱ — اطلاعات شخصی
export const kycPersonalSchema = z.object({
  firstName: z.string().trim().min(2, 'نام الزامی است').max(64),
  lastName: z.string().trim().min(2, 'نام خانوادگی الزامی است').max(64),
  birthDate: birthDateSchema,
})

// مرحله ۲ — اطلاعات هویتی
export const kycIdentitySchema = z.object({
  nationalCode: nationalCodeStrict,
  shenasnamehNo: shenasnamehNoSchema,
})

// مرحله ۳ — هویت بانکی
export const kycBankSchema = z.object({
  cardNumber: cardNumberSchema,
  iban: ibanStrict,
})

// Draft — هر subset از فیلدها؛ برای ذخیره میان‌مرحله‌ای
export const kycDraftSchema = z.object({
  firstName: kycPersonalSchema.shape.firstName.optional(),
  lastName: kycPersonalSchema.shape.lastName.optional(),
  birthDate: birthDateSchema.optional(),
  nationalCode: nationalCodeStrict.optional(),
  shenasnamehNo: shenasnamehNoSchema.optional(),
  cardNumber: cardNumberSchema.optional(),
  iban: ibanStrict.optional(),
  currentStep: z.number().int().min(0).max(5).optional(),
})

// انواع مدرک مجاز — Magic bytes در service هم بررسی می‌شود
export const KYC_DOC_KINDS = ['ID_CARD_FRONT', 'ID_CARD_BACK', 'SELFIE'] as const
export type KycDocKindInput = (typeof KYC_DOC_KINDS)[number]

export const KYC_MAX_FILE_BYTES = 5 * 1024 * 1024 // ۵MB
export const KYC_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
