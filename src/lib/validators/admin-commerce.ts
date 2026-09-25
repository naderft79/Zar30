// ============================================
// Zar30 - Admin Commerce Validators (Phase 2)
// ============================================
// محصولات/دسته‌بندی/کد تخفیف/کارمزد/محدودیت/سطح KYC
// ============================================

import { z } from 'zod'
import { isValidAdminDateInput, parseAdminDateBoundary } from '@/lib/utils/admin-time'

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const q = z.string().trim().max(80).optional()

const adminDate = z
  .string()
  .refine(isValidAdminDateInput, 'تاریخ باید ISO datetime یا YYYY-MM-DD معتبر باشد')

function withRange<T extends z.ZodRawShape>(shape: T) {
  return pagination
    .extend(shape)
    .and(
      z
        .object({ from: adminDate.optional(), to: adminDate.optional() })
        .refine(
          (v) =>
            !v.from ||
            !v.to ||
            parseAdminDateBoundary(v.from, false) <= parseAdminDateBoundary(v.to, true),
          { message: 'بازه زمانی نامعتبر است — «از» باید قبل از «تا» باشد' },
        ),
    )
}

const toman = z.coerce.bigint().min(0n)
const grams = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, 'وزن نامعتبر است')
const bps = z.coerce.number().int().min(0).max(10_000)

// ---------- Products ----------

export const adminProductListQuerySchema = pagination.extend({
  q,
  categoryId: z.string().uuid().optional(),
  kind: z.enum(['COIN', 'BAR', 'JEWELRY']).optional(),
  active: z.enum(['true', 'false']).optional(),
})

export const adminProductSchema = z.object({
  sku: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().uuid().nullable().optional(),
  kind: z.enum(['COIN', 'BAR', 'JEWELRY']),
  weightGrams: grams,
  premiumToman: toman,
  stock: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().trim().url().max(500).nullable().optional(),
})

// ---------- Categories ----------

export const adminCategoryListQuerySchema = pagination.extend({ q })

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'slug فقط حروف کوچک، عدد و خط تیره')
    .min(2)
    .max(80),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

// ---------- Discount Codes ----------

export const adminDiscountListQuerySchema = pagination.extend({
  q,
  appliesTo: z.enum(['TRADE_FEE', 'COIN_PREMIUM', 'SHOP']).optional(),
  active: z.enum(['true', 'false']).optional(),
})

export const adminDiscountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/, 'کد فقط حروف/عدد/خط تیره — ۳ تا ۴۰ کاراکتر'),
    type: z.enum(['PERCENT', 'FIXED']),
    value: toman,
    maxUses: z.coerce.number().int().min(1).nullable().optional(),
    minPurchase: toman.nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    appliesTo: z.enum(['TRADE_FEE', 'COIN_PREMIUM', 'SHOP']),
    active: z.boolean().default(true),
  })
  .refine((v) => v.type !== 'PERCENT' || (v.value >= 1n && v.value <= 100n), {
    message: 'تخفیف درصدی باید بین ۱ تا ۱۰۰ باشد',
    path: ['value'],
  })

// ---------- Fee Rules ----------

export const adminFeeRuleSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(['KYC_LEVEL', 'VOLUME']),
    kycLevel: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']).nullable().optional(),
    minVolumeToman: toman.nullable().optional(),
    buyFeeBps: bps,
    sellFeeBps: bps,
    priority: z.coerce.number().int().min(0).max(999).default(0),
    active: z.boolean().default(true),
  })
  .refine((v) => v.kind !== 'KYC_LEVEL' || v.kycLevel != null, {
    message: 'برای قانون سطح KYC انتخاب سطح الزامی است',
    path: ['kycLevel'],
  })
  .refine((v) => v.kind !== 'VOLUME' || v.minVolumeToman != null, {
    message: 'برای قانون حجمی، حداقل حجم الزامی است',
    path: ['minVolumeToman'],
  })

export const adminUserFeeSchema = z.object({
  userId: z.string().uuid(),
  buyFeeBps: bps.nullable().optional(),
  sellFeeBps: bps.nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
})

// ---------- Limits ----------

export const adminLimitRuleSchema = z
  .object({
    scope: z.enum(['WITHDRAW', 'TRADE', 'TRANSFER']),
    kycLevel: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']).nullable().optional(),
    period: z.enum(['DAILY', 'MONTHLY']),
    amountToman: toman.nullable().optional(),
    amountGold: grams.nullable().optional(),
    active: z.boolean().default(true),
  })
  .refine((v) => v.amountToman != null || v.amountGold != null, {
    message: 'حداقل یک سقف (تومان یا گرم) لازم است',
  })
  .refine((v) => v.scope !== 'TRANSFER' || v.amountGold != null, {
    message: 'سقف انتقال باید به گرم تعریف شود',
    path: ['amountGold'],
  })

export const adminLimitListQuerySchema = pagination.extend({
  scope: z.enum(['WITHDRAW', 'TRADE', 'TRANSFER']).optional(),
  kycLevel: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']).optional(),
})

// ---------- Levels ----------

export const adminKycLevelSchema = z.object({
  level: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']),
  name: z.string().trim().min(2).max(80),
  rank: z.coerce.number().int().min(0).default(0),
  description: z.string().trim().max(300).nullable().optional(),
})

// ---------- Coin Holdings ----------

export const adminCoinHoldingListQuerySchema = withRange({
  q,
  productId: z.string().uuid().optional(),
})

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>
export type AdminCategoryListQuery = z.infer<typeof adminCategoryListQuerySchema>
export type AdminDiscountListQuery = z.infer<typeof adminDiscountListQuerySchema>
export type AdminLimitListQuery = z.infer<typeof adminLimitListQuerySchema>
export type AdminCoinHoldingListQuery = z.infer<typeof adminCoinHoldingListQuerySchema>
