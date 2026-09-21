// ============================================
// Zar30 - Trading Limits per KYC Level (Toman)
// ============================================
// ASSUMPTION: مقادیر «مبنا»ی MEGAPLAN به تومان هستند —
// این مقادیر قابل تنظیم هستند و باید در تصمیم محصولی نهایی شوند
// ============================================

import type { KycLevel } from '@/generated/prisma'

export interface LevelLimits {
  dailyTradeToman: bigint | null // سقف خرید/فروش روزانه به تومان — null یعنی نامحدود
  withdrawalToman: bigint | null // سقف برداشت روزانه به تومان — null یعنی نامحدود، 0 یعنی ممنوع
}

export const KYC_LIMITS: Record<KycLevel, LevelLimits> = {
  LEVEL_0: { dailyTradeToman: 0n, withdrawalToman: 0n },
  LEVEL_1: { dailyTradeToman: 5_000_000n, withdrawalToman: 0n },
  LEVEL_2: { dailyTradeToman: 50_000_000n, withdrawalToman: 50_000_000n },
  LEVEL_3: { dailyTradeToman: null, withdrawalToman: null },
}
