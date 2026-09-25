// ============================================
// Zar30 - Admin Automation Validators (Phase 3)
// ============================================
// SIP، هشدار قیمت، رویدادهای امنیتی، Rate Limit
// ============================================

import { z } from 'zod'

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const q = z.string().trim().max(80).optional()

// ---------- Savings Plans (SIP) ----------

export const adminSipListQuerySchema = pagination.extend({
  q,
  status: z.enum(['active', 'paused', 'failing']).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
})

export const adminSipToggleSchema = z.object({
  active: z.boolean(),
  reason: z.string().trim().max(300).optional(),
})

// ---------- Price Alerts ----------

export const adminAlertListQuerySchema = pagination.extend({
  q,
  direction: z.enum(['asc', 'desc']).default('desc'),
  alertDirection: z.enum(['ABOVE', 'BELOW']).optional(),
  status: z.enum(['active', 'triggered', 'inactive']).optional(),
})

// ---------- Security Events ----------

export const adminSecurityEventsQuerySchema = pagination.extend({
  q,
  action: z.string().trim().max(60).optional(),
})

// ---------- Rate Limit Config ----------

export const adminRateLimitSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9._-]+$/, 'key فقط حروف کوچک، عدد، نقطه و خط تیره')
    .min(3)
    .max(60),
  limit: z.coerce.number().int().min(1).max(100_000),
  windowSeconds: z.coerce.number().int().min(1).max(86_400),
  scope: z.enum(['IP', 'USER', 'MOBILE']),
  active: z.boolean().default(true),
})

export type AdminSipListQuery = z.infer<typeof adminSipListQuerySchema>
export type AdminAlertListQuery = z.infer<typeof adminAlertListQuerySchema>
export type AdminSecurityEventsQuery = z.infer<typeof adminSecurityEventsQuerySchema>
