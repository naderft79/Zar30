// ============================================
// Zar30 - Admin Ops Validators (Phase 1)
// ============================================
// query/body validatorهای کارت‌های بانکی، انتقال‌ها، پرداخت‌های درگاه و آدرس‌ها
// ============================================

import { z } from 'zod'
import { isValidAdminDateInput, parseAdminDateBoundary } from '@/lib/utils/admin-time'

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const adminDate = z
  .string()
  .refine(isValidAdminDateInput, 'تاریخ باید ISO datetime یا YYYY-MM-DD معتبر باشد')

const q = z.string().trim().max(80).optional()

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

export const adminBankAccountListQuerySchema = pagination.extend({
  q,
  bankCode: z.string().trim().max(10).optional(),
  blocked: z.enum(['true', 'false']).optional(),
})

export const adminTransferListQuerySchema = withRange({
  q,
  kind: z.enum(['TRANSFER', 'GIFT']).optional(),
  assetType: z.enum(['TOMAN', 'GOLD', 'SILVER']).optional(),
  flagged: z.enum(['true', 'false']).optional(),
})

export const adminPaymentListQuerySchema = withRange({
  q,
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED']).optional(),
  gateway: z.string().trim().max(40).optional(),
})

export const adminAddressListQuerySchema = pagination.extend({
  q,
  province: z.string().trim().max(60).optional(),
})

export const adminFlagSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل الزامی است').max(500),
})

export const adminBlockCardSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل مسدودسازی الزامی است').max(500),
})

export type AdminBankAccountListQuery = z.infer<typeof adminBankAccountListQuerySchema>
export type AdminTransferListQuery = z.infer<typeof adminTransferListQuerySchema>
export type AdminPaymentListQuery = z.infer<typeof adminPaymentListQuerySchema>
export type AdminAddressListQuery = z.infer<typeof adminAddressListQuerySchema>
