// ============================================
// Zar30 - Admin Risk & Reports Validators (Phase 4)
// ============================================
// قوانین ریسک، رویدادها، خروجی CSV، دفتر کل
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

// ---------- Risk Rules ----------

export const adminRiskRuleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  metric: z.enum([
    'WITHDRAW_SUM',
    'TRADE_SUM',
    'TRANSFER_COUNT',
    'TRANSFER_GOLD',
    'FAILED_PAYMENTS',
    'FLAGGED_TRANSFERS',
    'BLOCKED_CARDS',
    'LOGIN_IP_CHANGES',
  ]),
  threshold: z.coerce.number().positive(),
  windowHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 90)
    .default(24),
  scoreWeight: z.coerce.number().int().min(1).max(100).default(10),
  active: z.boolean().default(true),
})

// ---------- Risk Events ----------

export const adminRiskEventsQuerySchema = pagination.extend({
  q,
  status: z.enum(['open', 'reviewed']).optional(),
  minScore: z.coerce.number().int().min(0).optional(),
})

export const adminRiskReviewSchema = z.object({
  note: z.string().trim().max(300).optional(),
})

// ---------- Fraud ----------

export const adminFraudQuerySchema = pagination.extend({ q })

// ---------- Reports / Exports ----------

export const adminExportSchema = z
  .object({
    kind: z.enum(['orders', 'transactions', 'withdrawals', 'users', 'transfers', 'payments']),
    from: adminDate.optional(),
    to: adminDate.optional(),
  })
  .refine(
    (v) =>
      !v.from ||
      !v.to ||
      parseAdminDateBoundary(v.from, false) <= parseAdminDateBoundary(v.to, true),
    { message: 'بازه زمانی نامعتبر است' },
  )

export const adminExportsQuerySchema = pagination.extend({})

// ---------- Ledger (Journal) ----------

export const adminJournalQuerySchema = pagination.extend({
  q,
  status: z.enum(['POSTED', 'REVERSED']).optional(),
})

export type AdminRiskEventsQuery = z.infer<typeof adminRiskEventsQuerySchema>
export type AdminFraudQuery = z.infer<typeof adminFraudQuerySchema>
export type AdminJournalQuery = z.infer<typeof adminJournalQuerySchema>
