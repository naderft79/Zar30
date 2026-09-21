// ============================================
// Zar30 - Durable Idempotency
// ============================================
// PostgreSQL مرجع نهایی است — Redis هرگز برای idempotency نیست
//
// رفتار:
//   درخواست اول → اجرا و ذخیره پاسخ (COMPLETED)
//   تکرار با همان key + همان بدنه → پاسخ ذخیره‌شده (replayed)
//   تکرار با همان key + بدنه متفاوت → 409 IDEMPOTENCY_CONFLICT
//   تکرار همزمان (PROCESSING) → 409 CONCURRENT_OPERATION
//   شکست عملیات → FAILED و امکان retry با همان key
// ============================================

import { createHash } from 'crypto'
import prisma from '@/lib/db/prisma'
import { idempotencyKeySchema } from '@/lib/validators/common'
import { FinanceErrors } from './errors'
import { toJsonSafe } from './money'
import { logger } from '@/lib/logger/logger'

const TTL_MS = 24 * 60 * 60 * 1000 // ۲۴ ساعت

function hashBody(body: unknown): string {
  const canonical = JSON.stringify(body, Object.keys(body as object).sort())
  return createHash('sha256').update(canonical).digest('hex')
}

export interface IdempotencyResult<T> {
  data: T
  replayed: boolean
}

export async function withIdempotency<T>(
  opts: {
    req: Request
    userId: string
    endpoint: string
    body: unknown
  },
  fn: () => Promise<T>,
): Promise<IdempotencyResult<T>> {
  const rawKey = opts.req.headers.get('idempotency-key')
  const parsed = idempotencyKeySchema.safeParse(rawKey)
  if (!parsed.success) throw FinanceErrors.idempotencyKeyRequired()

  // scope کلید به کاربر + endpoint — جلوگیری از برخورد بین کاربران
  const scopedKey = `${opts.userId}:${opts.endpoint}:${parsed.data}`
  const requestHash = hashBody(opts.body)
  const expiresAt = new Date(Date.now() + TTL_MS)

  const claim = async () =>
    prisma.idempotencyRecord.create({
      data: {
        key: scopedKey,
        userId: opts.userId,
        endpoint: opts.endpoint,
        requestHash,
        status: 'PROCESSING',
        expiresAt,
      },
    })

  // ابتدا رکورد موجود را بررسی می‌کنیم — replay رایج‌ترین حالت است و نباید
  // با خطای unique همراه شود؛ create فقط در صورت نبود رکورد اجرا می‌شود
  const existing = await prisma.idempotencyRecord.findUnique({ where: { key: scopedKey } })
  if (existing) {
    if (existing.requestHash !== requestHash) throw FinanceErrors.idempotencyConflict()
    if (existing.status === 'COMPLETED') {
      return { data: existing.responseBody as T, replayed: true }
    }
    if (existing.status === 'PROCESSING') throw FinanceErrors.concurrentOperation()
    // FAILED → آزادسازی کلید برای retry
    await prisma.idempotencyRecord.delete({ where: { key: scopedKey } })
  }

  try {
    await claim()
  } catch {
    // race: درخواست همزمان دیگری رکورد را ساخت — وضعیت آن را برمی‌گردانیم
    const raced = await prisma.idempotencyRecord.findUnique({ where: { key: scopedKey } })
    if (!raced) throw FinanceErrors.concurrentOperation()
    if (raced.requestHash !== requestHash) throw FinanceErrors.idempotencyConflict()
    if (raced.status === 'COMPLETED') {
      return { data: raced.responseBody as T, replayed: true }
    }
    throw FinanceErrors.concurrentOperation()
  }

  try {
    const data = await fn()
    await prisma.idempotencyRecord.update({
      where: { key: scopedKey },
      data: {
        status: 'COMPLETED',
        responseBody: toJsonSafe(data) as object,
        responseHash: requestHash,
      },
    })
    return { data, replayed: false }
  } catch (err) {
    await prisma.idempotencyRecord
      .update({ where: { key: scopedKey }, data: { status: 'FAILED' } })
      .catch((e) => logger.error({ err: e, key: scopedKey }, 'Idempotency mark FAILED error'))
    throw err
  }
}
