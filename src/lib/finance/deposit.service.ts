// ============================================
// Zar30 - Deposit Service
// ============================================
// State machine: Transaction(DEPOSIT) PENDING → COMPLETED | FAILED | REVERSED
//
// credit فقط از مسیر این سرویس — journal:
//   DEBIT  ASSET_RIAL[user]        (دارایی ریالی کاربر)
//   CREDIT LIABILITY_USER_RIAL     (بدهی پلتفرم به کاربر)
// ============================================

import { Prisma, type KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { toAuditData, type AuditEntry } from '@/lib/audit/audit'
import { FinanceErrors } from './errors'
import { postJournal } from './ledger.service'
import { ensureAssetAccount, ensureWallet } from './wallet.service'
import { notifyFinancial } from './notify'

type Tx = Prisma.TransactionClient

const MIN_DEPOSIT_RIAL = BigInt(process.env.MIN_DEPOSIT_RIAL ?? '50000')
const MAX_DEPOSIT_RIAL = BigInt(process.env.MAX_DEPOSIT_RIAL ?? '5000000000')

async function lockTransaction(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<{ id: string; status: string; type: string }[]>`
    SELECT id, status, type FROM transactions WHERE id::text = ${id} FOR UPDATE
  `
  const t = rows[0]
  if (!t || t.type !== 'DEPOSIT') throw FinanceErrors.depositNotFound()
  return t
}

// ثبت درخواست واریز — فقط رکورد PENDING؛ اعتبار حساب با تایید ادمین/درگاه
export async function requestDeposit(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { amount: bigint },
) {
  if (input.amount < MIN_DEPOSIT_RIAL || input.amount > MAX_DEPOSIT_RIAL) {
    throw FinanceErrors.invalidAmount(
      `مبلغ واریز باید بین ${MIN_DEPOSIT_RIAL.toLocaleString('en')} و ${MAX_DEPOSIT_RIAL.toLocaleString('en')} ریال باشد`,
    )
  }

  const wallet = await ensureWallet(prisma, ctx.userId)
  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId: ctx.userId,
      type: 'DEPOSIT',
      amount: input.amount,
      status: 'PENDING',
    },
  })

  notifyFinancial(ctx.userId, 'deposit_requested', 'درخواست واریز ثبت شد', '', {
    transactionId: tx.id,
    amount: input.amount.toString(),
  })

  return { id: tx.id, amount: tx.amount.toString(), status: tx.status, createdAt: tx.createdAt }
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

// اعتبارسنجی واریز — PENDING → COMPLETED + سند + موجودی کاربر
export async function creditDeposit(
  ctx: AdminActCtx,
  transactionId: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const t = await lockTransaction(tx, transactionId)
    if (t.status !== 'PENDING') {
      throw FinanceErrors.invalidState('این واریز قبلاً پردازش شده است')
    }

    const deposit = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } })
    const rial = await ensureAssetAccount(tx, deposit.userId, 'RIAL')

    const journal = await postJournal(tx, {
      referenceType: 'DEPOSIT',
      referenceId: transactionId,
      description: `Deposit credit — ${deposit.amount.toString()} IRR`,
      legs: [
        {
          account: 'ASSET_RIAL',
          side: 'DEBIT',
          amountRial: deposit.amount,
          assetAccountId: rial.id,
        },
        { account: 'LIABILITY_USER_RIAL', side: 'CREDIT', amountRial: deposit.amount },
      ],
    })

    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED', journalEntryId: journal.id },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, 'deposit.credit', {
        entityType: 'transaction',
        entityId: transactionId,
        targetUserId: deposit.userId,
        before: { status: 'PENDING' },
        after: { status: 'COMPLETED', amount: deposit.amount.toString() },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return {
      id: updated.id,
      status: updated.status,
      userId: deposit.userId,
      amount: deposit.amount,
    }
  })

  notifyFinancial(result.userId, 'deposit_credited', 'واریز شما تایید شد', '', {
    transactionId: result.id,
    amount: result.amount.toString(),
  })
  return { id: result.id, status: result.status }
}

// رد واریز — PENDING → FAILED
export async function rejectDeposit(
  ctx: AdminActCtx,
  transactionId: string,
  reason: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const t = await lockTransaction(tx, transactionId)
    if (t.status !== 'PENDING') {
      throw FinanceErrors.invalidState('این واریز قبلاً پردازش شده است')
    }

    const deposit = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } })
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED' },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, 'deposit.reject', {
        entityType: 'transaction',
        entityId: transactionId,
        targetUserId: deposit.userId,
        reason,
        before: { status: 'PENDING' },
        after: { status: 'FAILED' },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return {
      id: updated.id,
      status: updated.status,
      userId: deposit.userId,
      amount: deposit.amount,
    }
  })

  notifyFinancial(result.userId, 'deposit_rejected', 'واریز شما تایید نشد', reason, {
    transactionId: result.id,
    amount: result.amount.toString(),
  })
  return { id: result.id, status: result.status }
}
