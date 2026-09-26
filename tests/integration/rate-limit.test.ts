// ============================================
// Zar30 - Rate Limit Integration Test (Redis واقعی)
// ============================================
// sliding-window روی Redis ZSET: limit enforce + ادمین bypass + fallback
// قانون و ادمین تستی در beforeAll ساخته می‌شوند — چون کش داخلی ۶۰ثانیه‌ای
// در اولین checkRateLimit پر می‌شود باید قبل از آن موجود باشند
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { checkRateLimit } from '../../src/lib/rate-limit/rate-limit'
import { redis } from '../../src/lib/redis/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const TEST_KEY = `test.ratelimit.${Date.now()}`
const IDENT = `test-ident-${Date.now()}`
let adminMobile = ''
let adminUserId = ''

beforeAll(async () => {
  await prisma.rateLimitConfig.create({
    data: { key: TEST_KEY, limit: 3, windowSeconds: 3600, scope: 'USER' },
  })
  const suffix = Date.now().toString().slice(-9)
  const adminUser = await prisma.user.create({
    data: {
      mobile: `0944${suffix}`,
      passwordHash: 'test',
      referralCode: `R${suffix}X`,
    },
  })
  adminUserId = adminUser.id
  adminMobile = adminUser.mobile
  await prisma.adminUser.create({
    data: { userId: adminUser.id, role: 'SUPER_ADMIN', permissions: [] },
  })
})

afterAll(async () => {
  await prisma.rateLimitConfig.deleteMany({ where: { key: TEST_KEY } })
  await redis.del(`ratelimit:${TEST_KEY}:${IDENT}`)
  await redis.del(`ratelimit:${TEST_KEY}:${adminMobile}`)
  await prisma.adminUser.deleteMany({ where: { userId: adminUserId } })
  await prisma.user.deleteMany({ where: { id: adminUserId } })
})

describe('Rate Limit (Redis واقعی)', () => {
  it('قانون fallback برای key ناشناخته → پاس و ساختار پاسخ', async () => {
    const res = await checkRateLimit('nonexistent.key', IDENT + '-a')
    expect(res.limit).toBe(100) // fallback api.general
    expect(res.remaining).toBeLessThanOrEqual(res.limit)
    expect(res.resetSeconds).toBe(60)
  })

  it('قانون DB با limit=3 — چهارمین درخواست 429 می‌شود', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(TEST_KEY, IDENT)
      expect(res.limit).toBe(3)
      expect(res.remaining).toBe(2 - i)
    }
    await expect(checkRateLimit(TEST_KEY, IDENT)).rejects.toMatchObject({ statusCode: 429 })
    // بعد از سقف، شمارنده همچنان ۳ است (عضویت جدید ثبت نشد)
    const count = await redis.zcard(`ratelimit:${TEST_KEY}:${IDENT}`)
    expect(count).toBe(3)
  })

  it('ادمین فعال — از هر limit معاف است و شمارنده مصرف نمی‌کند', async () => {
    const res = await checkRateLimit(TEST_KEY, adminMobile)
    expect(res.remaining).toBe(res.limit)
    const count = await redis.zcard(`ratelimit:${TEST_KEY}:${adminMobile}`)
    expect(count).toBe(0)
  })
})
