// ============================================
// Zar30 - Admin Dashboard V2 Validators
// ============================================
// همه ورودی‌های endpointهای داشبورد — Zod
// ============================================

import { z } from 'zod'

export const dashboardPeriodSchema = z.object({
  period: z.enum(['24h', '7d', '30d']).default('24h'),
})

export const dashboardChartsQuerySchema = z.object({
  range: z.coerce
    .number()
    .int()
    .refine((v): v is 7 | 30 | 90 => v === 7 || v === 30 || v === 90, {
      message: 'بازه باید ۷، ۳۰ یا ۹۰ روز باشد',
    })
    .default(30),
})

export const dashboardQueueKeySchema = z.enum([
  'kyc',
  'withdrawals',
  'orders',
  'tickets',
  'delivery',
  'risk',
  'zareesi',
])

export const dashboardLayoutSchema = z.object({
  hiddenWidgets: z.array(z.string().min(1).max(60)).max(40),
})

export const dashboardNoteSchema = z.object({
  text: z.string().trim().min(1, 'متن یادداشت الزامی است').max(500, 'حداکثر ۵۰۰ کاراکتر'),
  pinned: z.boolean().default(false),
})

export const killSwitchSchema = z.object({
  scope: z.enum(['TRADING', 'WITHDRAWALS']),
  action: z.enum(['HALT', 'RESUME']),
  // تأیید دومرحله‌ای — کلاینت باید عبارت دقیق را ارسال کند
  confirm: z.string().min(1, 'تأیید الزامی است'),
})

export const KILL_SWITCH_CONFIRM: Record<
  'TRADING' | 'WITHDRAWALS',
  { halt: string; resume: string }
> = {
  TRADING: { halt: 'توقف معاملات', resume: 'از سرگیری معاملات' },
  WITHDRAWALS: { halt: 'توقف برداشت', resume: 'از سرگیری برداشت' },
}
