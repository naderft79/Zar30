// ============================================
// Zar30 - Withdrawal Service
// ============================================
// State machine: PENDING → APPROVED → PAID | REJECTED/FAILED
//
// امنیت مالی:
// - در لحظه درخواست، مبلغ از balance به lockedBalance منتقل می‌شود
//   (D ASSET_LOCKED_TOMAN / C ASSET_TOMAN) → double-spend ممکن نیست
// - pay: آزادسازی قفل + انقضای بدهی (C ASSET_LOCKED_TOMAN / D LIABILITY_USER_TOMAN)
// - reject/fail: بازگشت قفل به موجودی (D ASSET_TOMAN / C ASSET_LOCKED_TOMAN)
// - همه تغییر وضعیت‌ها داخل transaction + FOR UPDATE روی درخواست
// ============================================

import { Prisma, type KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { toAuditData, type AuditEntry } from '@/lib/audit/audit'
import { FinanceErrors } from './errors'
import { postJournal } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { MIN_WITHDRAWAL_TOMAN } from './fee.service'
import { KYC_LIMITS } from './limits'
import { enforceLimit } from './limit.service'
import { notifyFinancial } from './notify'
import { triggerRiskEvaluation } from '@/lib/services/admin-risk.service'
import { isWithdrawalsHalted } from '@/lib/services/admin-system.service'

type Tx = Prisma.TransactionClient

async function lockWithdrawal(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
    SELECT id, status FROM withdrawal_requests WHERE id::text = ${id} FOR UPDATE
  `
  const w = rows[0]
  if (!w) throw FinanceErrors.withdrawalNotFound()
  return w
}

// درخواست برداشت — قفل مبلغ + سند + Transaction(PENDING)
export async function requestWithdrawal(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { amount: bigint; iban: string },
) {
  // توقف اضطراری ادمین — fail-closed (امنیت)
  if (await isWithdrawalsHalted()) throw FinanceErrors.withdrawalsHalted()
  if (input.amount < MIN_WITHDRAWAL_TOMAN) {
    throw FinanceErrors.invalidAmount(
      `حداقل مبلغ برداشت ${MIN_WITHDRAWAL_TOMAN.toLocaleString('en')} تومان است`,
    )
  }
  const limit = KYC_LIMITS[ctx.kycLevel].withdrawalToman
  if (limit === 0n) throw FinanceErrors.kycRequired('برای برداشت، احراز هویت سطح ۲ لازم است')
  if (limit !== null && input.amount > limit) {
    throw FinanceErrors.limitExceeded('مبلغ بیش از سقف برداشت روزانه شماست')
  }
  // قوانین محدودیت admin (LimitRule) — بازه لغزان روزانه/ماهانه
  await enforceLimit(ctx.userId, ctx.kycLevel, 'WITHDRAW', { toman: input.amount })

  const result = await prisma.$transaction(async (tx) => {
    const toman = await ensureAssetAccount(tx, ctx.userId, 'TOMAN')

    // قفل مبلغ — موجودی آزاد کم و مسدودشده زیاد می‌شود
    const journal = await postJournal(tx, {
      referenceType: 'WITHDRAWAL_LOCK',
      referenceId: ctx.userId,
      description: `Withdrawal lock — ${input.amount.toString()} TOMAN`,
      legs: [
        {
          account: 'ASSET_LOCKED_TOMAN',
          side: 'DEBIT',
          amountToman: input.amount,
          assetAccountId: toman.id,
        },
        {
          account: 'ASSET_TOMAN',
          side: 'CREDIT',
          amountToman: input.amount,
          assetAccountId: toman.id,
        },
      ],
    })

    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        userId: ctx.userId,
        amount: input.amount,
        iban: input.iban,
        status: 'PENDING',
        journalEntryId: journal.id,
      },
    })

    const transaction = await tx.transaction.create({
      data: {
        walletId: toman.walletId,
        userId: ctx.userId,
        type: 'WITHDRAW',
        amount: input.amount,
        status: 'PENDING',
        journalEntryId: journal.id,
      },
    })

    await tx.journalEntry.update({
      where: { id: journal.id },
      data: { referenceId: withdrawal.id },
    })

    return { withdrawal, transaction }
  })

  notifyFinancial(ctx.userId, 'withdrawal_requested', 'درخواست برداشت ثبت شد', '', {
    withdrawalId: result.withdrawal.id,
    amount: input.amount.toString(),
  })
  triggerRiskEvaluation(ctx.userId)

  return {
    id: result.withdrawal.id,
    amount: input.amount.toString(),
    status: result.withdrawal.status,
    createdAt: result.withdrawal.createdAt,
  }
}

interface AdminActCtx {
  adminId: string
  adminRole: string
}

function adminAudit(ctx: AdminActCtx, action: string, entry: Partial<AuditEntry>) {
  return toAuditData({
    actorType: 'admin',
    actorId: ctx.adminId,
    actorRole: ctx.adminRole,
    action,
    ...entry,
  } as AuditEntry)
}

// تایید برداشت — PENDING → APPROVED (پول همچنان قفل)
export async function approveWithdrawal(
  ctx: AdminActCtx,
  id: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  return prisma.$transaction(async (tx) => {
    const w = await lockWithdrawal(tx, id)
    if (w.status !== 'PENDING') throw FinanceErrors.withdrawalAlreadyProcessed()

    const updated = await tx.withdrawalRequest.update({
      where: { id },
      data: { status: 'APPROVED', processedBy: ctx.adminId, processedAt: new Date() },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, 'withdrawal.approve', {
        entityType: 'withdrawal',
        entityId: id,
        targetUserId: updated.userId,
        before: { status: 'PENDING' },
        after: { status: 'APPROVED' },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return { id: updated.id, status: updated.status }
  })
}

// پرداخت برداشت — APPROVED → PAID (قفل آزاد و بدهی منقضی می‌شود)
export async function payWithdrawal(
  ctx: AdminActCtx,
  id: string,
  audit: { ip?: string; userAgent?: string; requestId?: string; bankRef?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const w = await lockWithdrawal(tx, id)
    if (w.status !== 'APPROVED') throw FinanceErrors.withdrawalAlreadyProcessed()

    const request = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } })
    const toman = await ensureAssetAccount(tx, request.userId, 'TOMAN')

    const journal = await postJournal(tx, {
      referenceType: 'WITHDRAWAL_PAY',
      referenceId: id,
      description: `Withdrawal pay — ${request.amount.toString()} TOMAN`,
      legs: [
        {
          account: 'ASSET_LOCKED_TOMAN',
          side: 'CREDIT',
          amountToman: request.amount,
          assetAccountId: toman.id,
        },
        { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: request.amount },
      ],
    })

    const updated = await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'PAID',
        processedBy: ctx.adminId,
        processedAt: new Date(),
        journalEntryId: journal.id,
      },
    })

    await tx.transaction.updateMany({
      where: { journalEntry: { referenceId: id }, type: 'WITHDRAW', status: 'PENDING' },
      data: { status: 'COMPLETED', journalEntryId: journal.id, bankRef: audit.bankRef },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, 'withdrawal.pay', {
        entityType: 'withdrawal',
        entityId: id,
        targetUserId: updated.userId,
        before: { status: 'APPROVED' },
        after: { status: 'PAID', bankRef: audit.bankRef },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return {
      id: updated.id,
      status: updated.status,
      userId: updated.userId,
      amount: request.amount,
    }
  })

  notifyFinancial(result.userId, 'withdrawal_paid', 'برداشت شما پرداخت شد', '', {
    withdrawalId: result.id,
    amount: result.amount.toString(),
  })
  return { id: result.id, status: result.status }
}

// رد/لغو برداشت — PENDING|APPROVED → REJECTED (قفل به موجودی برمی‌گردد)
export async function rejectWithdrawal(
  ctx: AdminActCtx,
  id: string,
  reason: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const w = await lockWithdrawal(tx, id)
    if (w.status !== 'PENDING' && w.status !== 'APPROVED') {
      throw FinanceErrors.withdrawalAlreadyProcessed()
    }

    const request = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } })
    const toman = await ensureAssetAccount(tx, request.userId, 'TOMAN')

    // آزادسازی قفل — بازگشت به موجودی آزاد
    await postJournal(tx, {
      referenceType: 'WITHDRAWAL_RELEASE',
      referenceId: id,
      description: `Withdrawal release (rejected) — ${request.amount.toString()} TOMAN`,
      legs: [
        {
          account: 'ASSET_TOMAN',
          side: 'DEBIT',
          amountToman: request.amount,
          assetAccountId: toman.id,
        },
        {
          account: 'ASSET_LOCKED_TOMAN',
          side: 'CREDIT',
          amountToman: request.amount,
          assetAccountId: toman.id,
        },
      ],
    })

    const updated = await tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        processedBy: ctx.adminId,
        processedAt: new Date(),
        reviewNote: reason,
      },
    })

    await tx.transaction.updateMany({
      where: { journalEntry: { referenceId: id }, type: 'WITHDRAW', status: 'PENDING' },
      data: { status: 'FAILED' },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, 'withdrawal.reject', {
        entityType: 'withdrawal',
        entityId: id,
        targetUserId: updated.userId,
        reason,
        before: { status: w.status },
        after: { status: 'REJECTED' },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return {
      id: updated.id,
      status: updated.status,
      userId: updated.userId,
      amount: request.amount,
    }
  })

  notifyFinancial(result.userId, 'withdrawal_rejected', 'درخواست برداشت رد شد', reason, {
    withdrawalId: result.id,
    amount: result.amount.toString(),
  })
  return { id: result.id, status: result.status }
}

// لیست برداشت‌های کاربر
export async function listUserWithdrawals(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.withdrawalRequest.count({ where: { userId } }),
  ])
  return {
    items: items.map((w) => ({
      id: w.id,
      amount: w.amount.toString(),
      status: w.status,
      createdAt: w.createdAt,
    })),
    total,
  }
}
