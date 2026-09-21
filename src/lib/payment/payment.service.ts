// ============================================
// Zar30 - Payment Service
// ============================================
// جریان: create → redirect به درگاه → callback → verify → credit
// همه مبالغ تومان هستند — واحد درگاه فقط در adapter مدیریت می‌شود.
//
// محافظت‌ها:
//   - verify فقط یک بار؛ callback تکراری → replayed (بدون credit دوباره)
//   - قفل ردیفی روی payment داخل tx — double-processing ممکن نیست
//   - مبلغ verify با payment.amount باید برابر باشد → AMOUNT_MISMATCH
//   - انقضا: payment منقضی‌شده قابل verify نیست
// ============================================

import { Prisma, type KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { toAuditData } from '@/lib/audit/audit'
import { FinanceErrors } from '@/lib/finance/errors'
import { creditDepositCore } from '@/lib/finance/deposit.service'
import { ensureWallet } from '@/lib/finance/wallet.service'
import { notifyFinancial } from '@/lib/finance/notify'
import { getPaymentGateway } from './gateway'

type Tx = Prisma.TransactionClient

const PAYMENT_TTL_MS = 15 * 60 * 1000 // ۱۵ دقیقه
const MIN_DEPOSIT_TOMAN = BigInt(process.env.MIN_DEPOSIT_TOMAN ?? '5000')
const MAX_DEPOSIT_TOMAN = BigInt(process.env.MAX_DEPOSIT_TOMAN ?? '500000000')

function callbackUrl(): string {
  return process.env.PAYMENT_CALLBACK_URL ?? 'http://localhost:3000/api/v1/payments/callback'
}

// ساخت جلسه پرداخت — Transaction(DEPOSIT) + Payment + درخواست درگاه
export async function createDepositPayment(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { amount: bigint; description?: string },
) {
  if (input.amount < MIN_DEPOSIT_TOMAN || input.amount > MAX_DEPOSIT_TOMAN) {
    throw FinanceErrors.invalidAmount(
      `مبلغ واریز باید بین ${MIN_DEPOSIT_TOMAN.toLocaleString('en')} و ${MAX_DEPOSIT_TOMAN.toLocaleString('en')} تومان باشد`,
    )
  }

  const gateway = getPaymentGateway()
  const description =
    input.description ?? `شارژ کیف پول زرسی — ${input.amount.toLocaleString('en')} تومان`

  // ابتدا درخواست درگاه — در صورت شکست هیچ رکوردی نمی‌ماند
  const req = await gateway
    .requestPayment({
      amountToman: input.amount,
      description,
      callbackUrl: callbackUrl(),
    })
    .catch(() => {
      throw FinanceErrors.gatewayError()
    })

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, ctx.userId)
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: ctx.userId,
        type: 'DEPOSIT',
        amount: input.amount,
        status: 'PENDING',
      },
    })
    const payment = await tx.payment.create({
      data: {
        userId: ctx.userId,
        transactionId: transaction.id,
        gateway: gateway.name,
        amount: input.amount,
        authority: req.authority,
        description,
        expiresAt: new Date(Date.now() + PAYMENT_TTL_MS),
      },
    })
    return { payment, transaction }
  })

  return {
    paymentId: result.payment.id,
    transactionId: result.transaction.id,
    amount: result.payment.amount.toString(),
    authority: req.authority,
    redirectUrl: req.redirectUrl,
    gateway: gateway.name,
    expiresAt: result.payment.expiresAt,
  }
}

async function lockPayment(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
    SELECT id, status FROM payments WHERE id::text = ${id} FOR UPDATE
  `
  const p = rows[0]
  if (!p) throw FinanceErrors.paymentNotFound()
  return p
}

export interface CallbackResult {
  paymentId: string
  status: string
  replayed: boolean
  refId?: string | null
}

// پردازش callback درگاه — idempotent و double-processing-safe
export async function handleGatewayCallback(input: {
  authority: string
  status: string
}): Promise<CallbackResult> {
  const payment = await prisma.payment.findUnique({ where: { authority: input.authority } })
  if (!payment) throw FinanceErrors.paymentNotFound()

  // replay — callback تکراری هرگز credit دوباره نمی‌کند
  if (payment.status === 'PAID') {
    return { paymentId: payment.id, status: 'PAID', replayed: true, refId: payment.refId }
  }
  if (payment.status !== 'PENDING') {
    return { paymentId: payment.id, status: payment.status, replayed: true }
  }

  // کاربر پرداخت را لغو کرده یا ناموفق برگشته
  if (input.status !== 'OK') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED', failureReason: `gateway_status:${input.status}` },
    })
    return { paymentId: payment.id, status: 'CANCELLED', replayed: false }
  }

  if (payment.expiresAt < new Date()) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
    return { paymentId: payment.id, status: 'EXPIRED', replayed: false }
  }

  const gateway = getPaymentGateway(payment.gateway)
  const verify = await gateway
    .verifyPayment({ authority: input.authority, amountToman: payment.amount })
    .catch(() => {
      throw FinanceErrors.gatewayError()
    })

  if (!verify.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: verify.error ?? 'verify_failed' },
    })
    throw FinanceErrors.gatewayError('تایید پرداخت توسط درگاه ناموفق بود')
  }

  // کنترل مبلغ — مبلغ تاییدشده درگاه باید با پرداخت داخلی برابر باشد
  if (verify.amountToman != null && verify.amountToman !== payment.amount) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: `amount_mismatch:${verify.amountToman.toString()}!=${payment.amount.toString()}`,
      },
    })
    throw FinanceErrors.amountMismatch()
  }

  // credit اتمیک — قفل ردیفی payment جلوی پردازش موازی را می‌گیرد
  const result = await prisma.$transaction(async (tx) => {
    const locked = await lockPayment(tx, payment.id)
    if (locked.status === 'PAID') {
      return { alreadyPaid: true as const }
    }
    if (locked.status !== 'PENDING') {
      throw FinanceErrors.invalidState('این پرداخت قابل پردازش نیست')
    }

    const credited = await creditDepositCore(tx, payment.transactionId!)

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        refId: verify.refId,
        cardPan: verify.cardPan,
        verifiedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'system',
        actorId: `gateway:${payment.gateway}`,
        action: 'payment.verify',
        entityType: 'payment',
        entityId: payment.id,
        targetUserId: payment.userId,
        before: { status: 'PENDING' },
        after: { status: 'PAID', refId: verify.refId, amount: payment.amount.toString() },
      }),
    })

    return { alreadyPaid: false as const, updated, userId: credited.deposit.userId }
  })

  if (result.alreadyPaid) {
    const fresh = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
    return { paymentId: payment.id, status: 'PAID', replayed: true, refId: fresh.refId }
  }

  notifyFinancial(result.userId, 'deposit_credited', 'واریز شما تایید شد', '', {
    transactionId: payment.transactionId,
    amount: payment.amount.toString(),
  })

  return { paymentId: payment.id, status: 'PAID', replayed: false, refId: verify.refId }
}

// لیست پرداخت‌های کاربر — فقط مالک
export async function listUserPayments(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where: { userId } }),
  ])
  return {
    items: items.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      gateway: p.gateway,
      status: p.status,
      refId: p.refId,
      createdAt: p.createdAt,
    })),
    total,
  }
}
