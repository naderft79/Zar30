// ============================================
// Zarnama - Playwright Global Setup
// ============================================
// پاک‌سازی شمارنده‌های Rate Limit قبل از اجرای تست‌ها
// تا اجراهای قبلی در پنجره ۱ ساعته باعث شکست جعلی نشوند
// ============================================

import Redis from 'ioredis'

export default async function globalSetup() {
  const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
  })
  try {
    await client.connect()
    const keys = await client.keys('ratelimit:*')
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[e2e-setup] Cleared ${keys.length} rate limit keys`)
    }
  } finally {
    await client.quit()
  }
}
