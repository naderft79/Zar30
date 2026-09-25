// ============================================
// Zar30 - Admin Delivery Validators (Phase 1)
// ============================================

import { z } from 'zod'
import { isValidAdminDateInput, parseAdminDateBoundary } from '@/lib/utils/admin-time'

const adminDate = z
  .string()
  .refine(isValidAdminDateInput, 'تاریخ باید ISO datetime یا YYYY-MM-DD معتبر باشد')

export const adminDeliveryListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    direction: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().trim().max(80).optional(),
    status: z
      .enum(['PENDING', 'APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELLED'])
      .optional(),
    method: z.enum(['POST', 'PICKUP']).optional(),
    from: adminDate.optional(),
    to: adminDate.optional(),
  })
  .refine(
    (v) =>
      !v.from ||
      !v.to ||
      parseAdminDateBoundary(v.from, false) <= parseAdminDateBoundary(v.to, true),
    { message: 'بازه زمانی نامعتبر است — «از» باید قبل از «تا» باشد' },
  )

export const adminDeliveryReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().trim().max(500).optional(),
})

export const adminDeliveryShipSchema = z
  .object({
    trackingCode: z.string().trim().min(3).max(60).optional(),
    pickupBranch: z.string().trim().max(120).optional(),
    pickupAt: z.string().datetime().optional(),
  })
  .refine((v) => v.trackingCode || (v.pickupBranch && v.pickupAt), {
    message: 'برای ارسال پستی کد رهگیری یا برای تحویل حضوری شعبه و زمان لازم است',
  })

export const adminDeliverySettingsSchema = z.object({
  feePost: z.coerce.bigint().min(0n),
  feePickup: z.coerce.bigint().min(0n),
  minGrams: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,6})?$/, 'مقدار طلا نامعتبر است'),
})

export const adminReasonSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل الزامی است').max(500),
})

export type AdminDeliveryListQuery = z.infer<typeof adminDeliveryListQuerySchema>
