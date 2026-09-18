// ============================================
// Zarnama - Rate Limiting (Phase 2)
// ============================================
// Sliding window با Redis ZSET — مقادیر از RateLimitConfig (DB) خوانده می‌شوند
// Redis هرگز مرجع نهایی نیست؛ در دسترس‌نبودن Redis → fail-open با لاگ
// ============================================

import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'

interface RateLimitRule {
  limit: number
  windowSeconds: number
  scope: string
}

// Fallback فقط وقتی DB/Redis در دسترس نیست یا key تنظیم نشده
const FALLBACK_RULES: Record<string, RateLimitRule> = {
  'api.general': { limit: 100, windowSeconds: 60, scope: 'ip' },
  'otp.send': { limit: 5, windowSeconds: 3600, scope: 'mobile' },
  'otp.verify': { limit: 10, windowSeconds: 3600, scope: 'mobile' },
  'auth.login': { limit: 10, windowSeconds: 3600, scope: 'mobile' },
  'auth.register': { limit: 10, windowSeconds: 3600, scope: 'ip' },
  'auth.password_reset': { limit: 5, windowSeconds: 3600, scope: 'mobile' },
}

let cachedRules: { rules: Record<string, RateLimitRule>; loadedAt: number } | null = null

// پیکربندی از DB با cache ۶۰ ثانیه‌ای — ادمین می‌تواند بدون deploy تغییر دهد
async function loadRules(): Promise<Record<string, RateLimitRule>> {
  if (cachedRules && Date.now() - cachedRules.loadedAt < 60_000) return cachedRules.rules
  try {
    const rows = await prisma.rateLimitConfig.findMany({ where: { active: true } })
    const rules: Record<string, RateLimitRule> = { ...FALLBACK_RULES }
    for (const row of rows) {
      rules[row.key] = { limit: row.limit, windowSeconds: row.windowSeconds, scope: row.scope }
    }
    cachedRules = { rules, loadedAt: Date.now() }
    return rules
  } catch (err) {
    logger.warn({ err }, 'RateLimitConfig load failed — using fallback rules')
    return FALLBACK_RULES
  }
}

export interface RateLimitResult {
  limit: number
  remaining: number
  resetSeconds: number
}

export async function checkRateLimit(
  configKey: string,
  identifier: string,
): Promise<RateLimitResult> {
  const rules = await loadRules()
  const rule = rules[configKey] ?? FALLBACK_RULES['api.general']!
  const key = `ratelimit:${configKey}:${identifier}`
  const now = Date.now()
  const windowStartMs = now - rule.windowSeconds * 1000

  try {
    await redis.zremrangebyscore(key, 0, windowStartMs)
    const count = await redis.zcard(key)
    if (count >= rule.limit) {
      // زمان reset ≈ قدیمی‌ترین عضو پنجره + window
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now
      const resetSeconds = Math.max(
        1,
        Math.ceil((oldestScore + rule.windowSeconds * 1000 - now) / 1000),
      )
      throw ApiError.tooManyRequests(
        `تعداد درخواست‌ها بیش از حد مجاز است. تا ${resetSeconds} ثانیه دیگر تلاش کنید`,
      )
    }
    await redis.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`)
    await redis.pexpire(key, rule.windowSeconds * 1000)
    return {
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - count - 1),
      resetSeconds: rule.windowSeconds,
    }
  } catch (err) {
    if (err instanceof ApiError) throw err
    // Redis down → fail-open (rate limit بخشی از integrity مالی نیست ولی شکستش باید دیده شود)
    logger.warn({ err, configKey }, 'Rate limit check failed — failing open')
    return { limit: rule.limit, remaining: rule.limit, resetSeconds: rule.windowSeconds }
  }
}
