// ============================================
// Zar30 - Common Zod Validators
// ============================================
// اعتبارسنجی ورودی‌های مشترک
// ============================================

import { z } from 'zod'

// شماره موبایل ایرانی (۰۹x)
export const iranMobileSchema = z
  .string()
  .regex(/^09\d{9}$/, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود')

// کد ملی ایرانی
export const nationalCodeSchema = z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد')

// کد OTP (۶ رقم)
export const otpCodeSchema = z.string().regex(/^\d{6}$/, 'کد تایید باید ۶ رقم باشد')

// رمز عبور (حداقل ۸ کاراکتر، حروف + عدد)
export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .regex(/[a-zA-Z]/, 'رمز عبور باید شامل حروف باشد')
  .regex(/\d/, 'رمز عبور باید شامل عدد باشد')

// شماره شبا ایرانی
export const ibanSchema = z
  .string()
  .regex(/^IR\d{24}$/, 'شماره شبا باید با IR شروع و ۲۶ کاراکتر باشد')

// مبلغ ریالی (مثبت)
export const rialAmountSchema = z
  .number()
  .int('مبلغ باید عدد صحیح باشد')
  .positive('مبلغ باید مثبت باشد')

// وزن طلا (مثبت، حداکثر ۸ رقم اعشار)
export const goldAmountSchema = z
  .number()
  .positive('مقدار طلا باید مثبت باشد')
  .multipleOf(0.00000001, 'دقت طلا حداکثر ۸ رقم اعشار است')

// صفحه بندی
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// مرتب سازی
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Idempotency-Key header
export const idempotencyKeySchema = z.string().min(8).max(255)

export type PaginationInput = z.infer<typeof paginationSchema>
export type SortInput = z.infer<typeof sortSchema>
