// ============================================
// Zar30 - Trading Limits per KYC Level
// ============================================
// ASSUMPTION: مقادیر «مبنا»ی MEGAPLAN به ریال تبدیل شده‌اند —
// این مقادیر قابل تنظیم هستند و باید در تصمیم محصولی نهایی شوند
// ============================================

import type { KycLevel } from '@/generated/prisma'

export interface LevelLimits {
  dailyTradeRial: bigint | null // سقف خرید/فروش روزانه — null یعنی نامحدود
  withdrawalRial: bigint | null // سقف برداشت روزانه — null یعنی نامحدود، 0 یعنی ممنوع
}

export const KYC_LIMITS: Record<KycLevel, LevelLimits> = {
  LEVEL_0: { dailyTradeRial: 0n, withdrawalRial: 0n },
  LEVEL_1: { dailyTradeRial: 50_000_000n, withdrawalRial: 0n },
  LEVEL_2: { dailyTradeRial: 500_000_000n, withdrawalRial: 500_000_000n },
  LEVEL_3: { dailyTradeRial: null, withdrawalRial: null },
}
