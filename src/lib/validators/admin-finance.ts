// ============================================
// Zar30 - Admin Finance Query Validators
// ============================================
// اسکیمای query لیست‌های مالی read-only مرکز عملیات
// تاریخ‌ها در service به Date تبدیل می‌شوند — refine از<=تا اینجا
// ============================================

import { z } from 'zod'
import { isValidAdminDateInput, parseAdminDateBoundary } from '@/lib/utils/admin-time'

const financePagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

// ISO datetime یا date-only YYYY-MM-DD (UTC calendar day)
const adminDate = z
  .string()
  .refine(isValidAdminDateInput, 'تاریخ باید ISO datetime یا YYYY-MM-DD معتبر باشد')

const dateRange = z
  .object({ from: adminDate.optional(), to: adminDate.optional() })
  .refine(
    (v) =>
      !v.from ||
      !v.to ||
      parseAdminDateBoundary(v.from, false) <= parseAdminDateBoundary(v.to, true),
    { message: 'بازه زمانی نامعتبر است — «از» باید قبل از «تا» باشد' },
  )

function withRange<T extends z.ZodRawShape>(shape: T) {
  return financePagination.extend(shape).and(dateRange)
}

const q = z.string().trim().max(80).optional()

export const adminAccountListQuerySchema = financePagination.extend({
  q,
  assetType: z.enum(['RIAL', 'GOLD', 'SILVER']).optional(),
})

export const adminWalletListQuerySchema = financePagination.extend({
  q,
  status: z.string().trim().max(32).optional(),
})

export const adminOrderListQuerySchema = withRange({
  q,
  status: z.enum(['PENDING', 'LOCKED', 'FILLED', 'CANCELLED', 'FAILED']).optional(),
  type: z.enum(['BUY', 'SELL']).optional(),
})

export const adminTransactionListQuerySchema = withRange({
  q,
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']).optional(),
  type: z.enum(['DEPOSIT', 'WITHDRAW', 'FEE', 'TRANSFER']).optional(),
})

export const adminDepositListQuerySchema = withRange({
  q,
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']).optional(),
})

export const adminWithdrawalListQuerySchema = withRange({
  q,
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'FAILED']).optional(),
})

export const adminPricingListQuerySchema = withRange({
  source: z.string().trim().max(64).optional(),
})

export type AdminAccountListQuery = z.infer<typeof adminAccountListQuerySchema>
export type AdminWalletListQuery = z.infer<typeof adminWalletListQuerySchema>
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>
export type AdminTransactionListQuery = z.infer<typeof adminTransactionListQuerySchema>
export type AdminDepositListQuery = z.infer<typeof adminDepositListQuerySchema>
export type AdminWithdrawalListQuery = z.infer<typeof adminWithdrawalListQuerySchema>
export type AdminPricingListQuery = z.infer<typeof adminPricingListQuerySchema>
