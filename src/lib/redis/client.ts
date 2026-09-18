// ============================================
// Zarnama - Redis Client (ioredis)
// ============================================
// Redis is used for: cache, queue (BullMQ), pub/sub, rate limiting
// Redis is NOT the source of truth for financial integrity
// PostgreSQL is the primary source of truth
// ============================================

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // بعد از ۱۰ تلاش متوقف می شود تا لاگ اسپم نشود
      if (times > 10) return null
      const delay = Math.min(times * 500, 5000)
      return delay
    },
    // اتصال فعال — با enableOfflineQueue=false دستورات بدون اتصال fail می شوند
    enableOfflineQueue: false, // صف آفلاین غیرفعال — عملیات مالی فقط آنلاین
  })

  // جلوگیری از unhandled error event
  client.on('error', (_err) => {
    // لاگ ساکت — health endpoint وضعیت را گزارش می دهد
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export default redis
