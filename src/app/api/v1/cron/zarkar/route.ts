// ============================================
// Zar30 - /api/v1/cron/zarkar
// ============================================
// POST → پرداخت سود دوره‌ای زرکار + سررسید موقعیت‌ها
//        فقط با Authorization: Bearer <CRON_SECRET> — نه session کاربر
// ============================================

import { timingSafeEqual } from 'crypto'
import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { processZarkarPayouts } from '@/lib/finance/zarkar.service'

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}

export const POST = withErrorHandler(async (req: Request) => {
  if (!process.env.CRON_SECRET) {
    logger.error('CRON_SECRET is not configured — ZarKar cron rejected')
    throw ApiError.internal('Cron is not configured')
  }
  if (!isAuthorized(req)) throw ApiError.unauthorized()

  const result = await processZarkarPayouts()
  logger.info(result, 'ZarKar cron completed')
  return ok(result)
})
