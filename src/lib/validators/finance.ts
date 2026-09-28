// ============================================
// Zar30 - Financial Validators
// ============================================

import { z } from 'zod'
import { ibanSchema, paginationSchema } from './common'

// مبلغ تومانی به صورت رشته عددی — BigInt-safe (بدون محدودیت Number)
const bigIntAmount = z
  .string()
  .regex(/^\d+$/, 'مبلغ باید عدد صحیح مثبت باشد')
  .transform((v) => BigInt(v))
  .refine((v) => v > 0n, 'مبلغ باید مثبت باشد')

// مقدار طلا — رشته اعشاری تا ۸ رقم
const goldAmount = z
  .string()
  .regex(/^\d+(\.\d{1,8})?$/, 'مقدار طلا باید عدد مثبت با حداکثر ۸ رقم اعشار باشد')
  .refine((v) => Number(v) > 0, 'مقدار طلا باید مثبت باشد')

export const createOrderSchema = z
  .object({
    type: z.enum(['BUY', 'SELL']),
    tomanAmount: bigIntAmount.optional(),
    goldAmount: goldAmount.optional(),
  })
  .refine((d) => (d.type === 'BUY' ? !!d.tomanAmount : !!d.goldAmount), {
    message: 'برای خرید tomanAmount و برای فروش goldAmount الزامی است',
  })

export const createDepositSchema = z.object({
  amount: bigIntAmount,
})

export const createWithdrawalSchema = z
  .object({
    amount: bigIntAmount,
    iban: ibanSchema.optional(),
    bankAccountId: z.string().uuid().optional(),
    otpCode: z.string().regex(/^\d{4,8}$/, 'کد تایید نامعتبر است'),
  })
  .refine((d) => !!d.iban || !!d.bankAccountId, {
    message: 'شماره شبا یا انتخاب حساب بانکی الزامی است',
  })

export const adminRejectSchema = z.object({
  reason: z.string().min(3).max(500),
})

export const adminPayWithdrawalSchema = z.object({
  bankRef: z.string().max(100).optional(),
})

export const adminReverseSchema = z.object({
  reason: z.string().min(3).max(500),
})

export const adminRecordPriceSchema = z.object({
  buyPrice: bigIntAmount,
  sellPrice: bigIntAmount,
  source: z.string().min(1).max(50).default('admin'),
})

export const financeListQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CreateDepositInput = z.infer<typeof createDepositSchema>
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>

// ============================================
// Zareesi Card — کارت زرسی
// ============================================

export const ZAREESI_CARD_COLORS = ['GOLD', 'NAVY', 'CREAM'] as const

export const orderZareesiCardSchema = z.object({
  color: z.enum(ZAREESI_CARD_COLORS, { message: 'رنگ کارت نامعتبر است' }),
  holderName: z
    .string()
    .trim()
    .min(3, 'نام حک‌شده روی کارت باید حداقل ۳ کاراکتر باشد')
    .max(40, 'نام حک‌شده روی کارت حداکثر ۴۰ کاراکتر است'),
  shippingMethod: z.enum(['POST', 'PICKUP']).default('POST'),
  deliveryAddressId: z.string().uuid('آدرس تحویل نامعتبر است').optional(),
})

export type OrderZareesiCardInput = z.infer<typeof orderZareesiCardSchema>
