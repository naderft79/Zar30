// ============================================
// Zar30 - Deposit Service
// ============================================
// State machine: Transaction(DEPOSIT) PENDING → COMPLETED | FAILED | REVERSED
//
// credit فقط از مسیر این سرویس — journal:
//   DEBIT  ASSET_TOMAN[user]        (دارایی تومانی کاربر)
//   CREDIT LIABILITY_USER_TOMAN     (بدهی پلتفرم به کاربر)
// ============================================

import { Prisma, type KycLevel } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { toAuditData, type AuditEntry } from '@/lib/audit/audit'
import { FinanceErrors } from './errors'
import { postJournal } from './ledger.service'
import { ensureAssetAccount, ensureWallet } from './wallet.service'
import { notifyFinancial } from './notify'

type Tx = Prisma.TransactionClient

const MIN_DEPOSIT_TOMAN = BigInt(process.env.MIN_DEPOSIT_TOMAN ?? '5000')
const MAX_DEPOSIT_TOMAN = BigInt(process.env.MAX_DEPOSIT_TOMAN ?? '500000000')

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
  if (input.amount < MIN_DEPOSIT_TOMAN || input.amount > MAX_DEPOSIT_TOMAN) {
    throw FinanceErrors.invalidAmount(
      `مبلغ واریز باید بین ${MIN_DEPOSIT_TOMAN.toLocaleString('en')} و ${MAX_DEPOSIT_TOMAN.toLocaleString('en')} تومان باشد`,
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

// هسته اعتبار واریز — داخل tx صدا زده می‌شود (ادمین یا سیستم/درگاه)
// PENDING → COMPLETED + سند + موجودی کاربر
export async function creditDepositCore(tx: Tx, transactionId: string) {
  const t = await lockTransaction(tx, transactionId)
  if (t.status !== 'PENDING') {
    throw FinanceErrors.invalidState('این واریز قبلاً پردازش شده است')
  }

  const deposit = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } })
  const toman = await ensureAssetAccount(tx, deposit.userId, 'TOMAN')

  const journal = await postJournal(tx, {
    referenceType: 'DEPOSIT',
    referenceId: transactionId,
    description: `Deposit credit — ${deposit.amount.toString()} TOMAN`,
    legs: [
      {
        account: 'ASSET_TOMAN',
        side: 'DEBIT',
        amountToman: deposit.amount,
        assetAccountId: toman.id,
      },
      { account: 'LIABILITY_USER_TOMAN', side: 'CREDIT', amountToman: deposit.amount },
    ],
  })

  const updated = await tx.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED', journalEntryId: journal.id },
  })

  return { updated, deposit }
}

// اعتبارسنجی واریز توسط ادمین — core + audit ادمین
export async function creditDeposit(
  ctx: AdminActCtx,
  transactionId: string,
  audit: { ip?: string; userAgent?: string; requestId?: string },
) {
  const result = await prisma.$transaction(async (tx) => {
    const { updated, deposit } = await creditDepositCore(tx, transactionId)

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
