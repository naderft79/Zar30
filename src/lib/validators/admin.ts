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
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'creditScore', 'mobile']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

// ویرایش مشخصات پایه کاربر توسط ادمین
export const adminUserProfileSchema = z.object({
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  email: z
    .string()
    .trim()
    .email('ایمیل معتبر نیست')
    .max(120)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

// تغییر سطح احراز هویت
export const adminUserLevelSchema = z.object({
  kycLevel: z.enum(['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']),
  reason: z.string().trim().min(5).max(500),
})

// امتیاز اعتباری دستی
export const adminUserCreditSchema = z.object({
  creditScore: z.coerce.number().int().min(0).max(1000),
  reason: z.string().trim().min(5).max(500),
})

// یادداشت/سیگنال ریسک دستی
export const adminUserRiskSchema = z.object({
  metric: z.string().trim().min(3).max(60),
  score: z.coerce.number().int().min(-1000).max(1000),
  note: z.string().trim().max(500).optional(),
})

// ارسال پیامک/اعلان به کاربر
export const adminUserSmsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  channel: z.enum(['SMS', 'IN_APP', 'PUSH']).default('SMS'),
})

export type AdminUserProfileInput = z.infer<typeof adminUserProfileSchema>
export type AdminUserLevelInput = z.infer<typeof adminUserLevelSchema>
export type AdminUserCreditInput = z.infer<typeof adminUserCreditSchema>
export type AdminUserRiskInput = z.infer<typeof adminUserRiskSchema>
export type AdminUserSmsInput = z.infer<typeof adminUserSmsSchema>

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
