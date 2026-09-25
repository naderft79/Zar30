// ============================================
// Zar30 - Admin System Validators (Phase 5)
// ============================================
// اعلان broadcast، قالب‌ها، نقش‌ها/اعضا، تنظیمات سامانه، SEO
// ============================================

import { z } from 'zod'
import { PERMISSIONS } from '@/lib/auth/rbac'

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const ALL_PERMS = Object.values(PERMISSIONS)

// ---------- Broadcast ----------

export const adminBroadcastSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(2000),
  audience: z.enum(['ALL', 'KYC_APPROVED', 'ACTIVE_30D']).default('ALL'),
})

// ---------- Notification Templates ----------

export const adminNotificationTemplateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_.-]+$/, 'کلید باید lowercase با حروف/عدد/._- باشد'),
  channels: z.array(z.enum(['IN_APP', 'PUSH', 'SMS', 'EMAIL'])).min(1),
  titleTemplate: z.string().trim().min(2).max(160),
  bodyTemplate: z.string().trim().min(2).max(2000),
  variables: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
})

export const adminTemplatesQuerySchema = pagination.extend({
  q: z.string().trim().max(80).optional(),
})

// ---------- Team / Roles ----------

const adminRole = z.enum([
  'SUPER_ADMIN',
  'FINANCE',
  'SUPPORT',
  'KYC',
  'RISK',
  'CONTENT',
  'OPERATIONS',
  'ANALYST',
  'READ_ONLY',
])

export const adminMemberUpdateSchema = z.object({
  role: adminRole.optional(),
  active: z.boolean().optional(),
  grant: z
    .array(z.enum(ALL_PERMS as [string, ...string[]]))
    .max(200)
    .optional(),
  revoke: z
    .array(z.enum(ALL_PERMS as [string, ...string[]]))
    .max(200)
    .optional(),
  reason: z.string().trim().min(3).max(300),
})

// ---------- Platform Settings ----------

export const adminSettingSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9_.:-]+$/i, 'کلید نامعتبر است'),
  value: z.unknown(),
})

export const adminSettingsQuerySchema = pagination.extend({
  q: z.string().trim().max(80).optional(),
  prefix: z.string().trim().max(60).optional(),
})

// ---------- SEO ----------

export const adminSeoSchema = z.object({
  page: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9/-]+$/i, 'مسیر صفحه نامعتبر است'),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  ogImage: z.string().trim().url().max(500).optional().or(z.literal('')),
})

export type AdminMemberUpdate = z.infer<typeof adminMemberUpdateSchema>
export type AdminSettingInput = z.infer<typeof adminSettingSchema>
export type AdminSeoInput = z.infer<typeof adminSeoSchema>
