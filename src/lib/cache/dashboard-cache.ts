// ============================================
// Zar30 - Dashboard Cache Helper (Admin Dashboard V2)
// ============================================
// کش Redis برای aggregateهای سنگین داشبورد — fail-open به DB
// PostgreSQL منبع حقیقت است؛ Redis فقط شتاب‌دهنده است
// ============================================

import { redis } from '@/lib/redis/client'
import { logger } from '@/lib/logger/logger'

const KEY_PREFIX = 'admin:dash:'

/**
 * خواندن/نوشتن کش Redis با fallback به اجرای کوئری.
 * خطای Redis هرگز عملیات اصلی را fail نمی‌کند — فقط no-cache می‌شود.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<{ data: T; cachedAt: string | null }> {
  const fullKey = `${KEY_PREFIX}${key}`
  try {
    const cached = await redis.get(fullKey)
    if (cached) {
      const parsed = JSON.parse(cached) as { data: T; cachedAt: string }
      return { data: parsed.data, cachedAt: parsed.cachedAt }
    }
  } catch {
    // کش خراب — ادامه به DB
  }

  const data = await producer()
  const cachedAt = new Date().toISOString()

  try {
    await redis.set(fullKey, JSON.stringify({ data, cachedAt }), 'EX', ttlSeconds)
  } catch (err) {
    logger.warn({ err, key: fullKey }, 'Dashboard cache write failed')
  }

  return { data, cachedAt }
}

/** ابطال دستی یک کلید کش — مثلاً بعد از mutation مرتبط */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(`${KEY_PREFIX}${key}`)
  } catch {
    // کش خراب — فایده‌ای ندارد retry کنیم
  }
}
