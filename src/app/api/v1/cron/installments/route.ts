// ============================================
// Zar30 - /api/v1/cron/installments
// ============================================
// POST → جریمه دیرکرد + نکول قراردادها — Bearer <CRON_SECRET>
// ============================================

import { timingSafeEqual } from 'crypto'
import { ok, withErrorHandler } from '@/lib/api/response'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { processInstallmentOverdue } from '@/lib/services/installment.service'

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
    logger.error('CRON_SECRET is not configured — installment cron rejected')
    throw ApiError.internal('Cron is not configured')
  }
  if (!isAuthorized(req)) throw ApiError.unauthorized()

  const result = await processInstallmentOverdue()
  logger.info(result, 'Installment cron completed')
  return ok(result)
})
