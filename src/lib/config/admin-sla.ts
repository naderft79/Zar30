// ============================================
// Zar30 - Admin SLA Thresholds (Admin Dashboard V2)
// ============================================
// آستانه‌های «قدیمی‌ترین رکورد در صف» — قابل override از PlatformSetting admin.sla
// مقادیر به ثانیه؛ warning قبل از breach
// ============================================

import prisma from '@/lib/db/prisma'

export type QueueKey =
  | 'kyc'
  | 'withdrawals'
  | 'orders'
  | 'tickets'
  | 'delivery'
  | 'risk'
  | 'zareesi'

export interface SlaThreshold {
  warningSec: number
  breachSec: number
}

// پیش‌فرض‌ها — در صورت نبود PlatformSetting
const DEFAULT_SLA: Record<QueueKey, SlaThreshold> = {
  kyc: { warningSec: 4 * 3600, breachSec: 24 * 3600 }, // ۴h / ۲۴h
  withdrawals: { warningSec: 2 * 3600, breachSec: 6 * 3600 }, // ۲h / ۶h
  orders: { warningSec: 30 * 60, breachSec: 2 * 3600 }, // ۳۰min / ۲h
  tickets: { warningSec: 2 * 3600, breachSec: 8 * 3600 }, // ۲h / ۸h
  delivery: { warningSec: 24 * 3600, breachSec: 72 * 3600 }, // ۲۴h / ۷۲h
  risk: { warningSec: 2 * 3600, breachSec: 12 * 3600 }, // ۲h / ۱۲h
  zareesi: { warningSec: 24 * 3600, breachSec: 72 * 3600 }, // ۲۴h / ۷۲h — چرخه تولید کارت زمان‌بر است
}

export type SlaState = 'ok' | 'warning' | 'breach'

/** وضعیت SLA بر اساس سن قدیمی‌ترین رکورد در صف */
export function slaState(oldestAgeSec: number | null, threshold: SlaThreshold): SlaState {
  if (oldestAgeSec === null) return 'ok'
  if (oldestAgeSec >= threshold.breachSec) return 'breach'
  if (oldestAgeSec >= threshold.warningSec) return 'warning'
  return 'ok'
}

/**
 * خواندن آستانه‌های SLA — از PlatformSetting admin.sla در صورت وجود، وگرنه پیش‌فرض.
 * بدون کش — حجم کم و فقط در جمع‌بندی داشبورد فراخوانی می‌شود.
 */
export async function getSlaThresholds(): Promise<Record<QueueKey, SlaThreshold>> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: 'admin.sla' } })
    if (!row?.value || typeof row.value !== 'object') return DEFAULT_SLA
    const override = row.value as Partial<Record<QueueKey, SlaThreshold>>
    const merged = { ...DEFAULT_SLA }
    for (const key of Object.keys(merged) as QueueKey[]) {
      const o = override[key]
      if (o && typeof o.warningSec === 'number' && typeof o.breachSec === 'number') {
        merged[key] = o
      }
    }
    return merged
  } catch {
    return DEFAULT_SLA
  }
}
