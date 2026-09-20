// ============================================
// Zar30 - Admin Query/Action Validators
// ============================================
// اسکیمای مشترک query pagination + فیلترهای list + mutationهای ادمین
// ============================================

import { z } from 'zod'

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const adminUserListQuerySchema = adminPaginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'DELETED']).optional(),
  kycLevel: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']).optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

export const adminUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED']),
  reason: z.string().trim().min(5).max(500),
})

export const adminKycListQuerySchema = adminPaginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  status: z
    .enum([
      'NOT_STARTED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'NEEDS_RESUBMISSION',
    ])
    .optional(),
  sortBy: z.enum(['createdAt', 'submittedAt', 'reviewedAt']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>
export type AdminKycListQuery = z.infer<typeof adminKycListQuerySchema>
export type AdminUserStatusInput = z.infer<typeof adminUserStatusSchema>
