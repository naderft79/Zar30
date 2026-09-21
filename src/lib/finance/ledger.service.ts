// ============================================
// Zar30 - Ledger Service (Double-Entry Core)
// ============================================
// تنها مسیر مجاز ثبت LedgerEntry و تغییر موجودی AssetAccount
//
// مدل موجودی: balance = موجودی آزاد (spendable) | lockedBalance = مسدودشده
//   موجودی کل = balance + lockedBalance
//   قفل کردن: balance کاهش + locked افزایش (مجموع ثابت)
//   پرداخت قفل: locked کاهش (پول از سیستم خارج می‌شود)
//   آزادسازی: balance افزایش + locked کاهش
//
// قراردادها:
// - هر Journal باید به ازای هر ارز تراز باشد: ΣDEBIT = ΣCREDIT
// - legهای دارای assetAccountId موجودی حساب را جابه‌جا می‌کنند:
//     ASSET_RIAL/ASSET_GOLD        → balance (آزاد)
//     ASSET_LOCKED_RIAL/GOLD       → lockedBalance
//     DEBIT → افزایش | CREDIT → کاهش
// - balance و lockedBalance هرگز منفی نمی‌شوند → race-safe
// - قفل ردیفی (SELECT ... FOR UPDATE) روی هر حساب قبل از تغییر
// - balanceAfter روی هر entry، مقدار بعدی همان بعد (balance یا locked)
// ============================================

import { Prisma } from '@/generated/prisma'
import { Decimal } from './money'
import { FinanceErrors } from './errors'

type Tx = Prisma.TransactionClient

export interface JournalLeg {
  account: string // code حساب دفتر کل
  side: 'DEBIT' | 'CREDIT'
  amountRial?: bigint
  amountGold?: Decimal | string
  assetAccountId?: string // فقط برای legهای سمت کاربر
}

export interface PostJournalInput {
  referenceType?: string
  referenceId?: string
  description: string
  legs: JournalLeg[]
}

interface LockedAssetAccount {
  id: string
  balance: Decimal
  lockedBalance: Decimal
}

// نگاشت code حساب → فیلد موجودی روی AssetAccount
const ACCOUNT_EFFECT: Record<string, 'balance' | 'lockedBalance'> = {
  ASSET_RIAL: 'balance',
  ASSET_LOCKED_RIAL: 'lockedBalance',
  ASSET_GOLD: 'balance',
  ASSET_LOCKED_GOLD: 'lockedBalance',
}

async function lockAssetAccount(tx: Tx, id: string): Promise<LockedAssetAccount> {
  const rows = await tx.$queryRaw<LockedAssetAccount[]>`
    SELECT id, balance, "locked_balance" AS "lockedBalance"
    FROM asset_accounts WHERE id::text = ${id} FOR UPDATE
  `
  const account = rows[0]
  if (!account) throw FinanceErrors.walletNotFound()
  return account
}

async function applyLegEffect(
  tx: Tx,
  leg: JournalLeg,
): Promise<{ assetAccountId: string; balanceAfter: Decimal } | null> {
  if (!leg.assetAccountId) return null
  const field = ACCOUNT_EFFECT[leg.account]
  if (!field) {
    throw FinanceErrors.ledgerAccountMissing(`effect:${leg.account}`)
  }

  const account = await lockAssetAccount(tx, leg.assetAccountId)
  const amount =
    leg.amountRial != null ? new Decimal(leg.amountRial.toString()) : new Decimal(leg.amountGold!)
  const signed = leg.side === 'DEBIT' ? amount : amount.neg()
  const current = new Decimal(account[field])
  const next = current.add(signed)

  if (next.isNegative()) {
    throw field === 'balance'
      ? FinanceErrors.insufficientBalance()
      : FinanceErrors.insufficientLocked()
  }

  await tx.assetAccount.update({
    where: { id: leg.assetAccountId },
    data: { [field]: next },
  })

  return { assetAccountId: leg.assetAccountId, balanceAfter: next }
}

// ثبت سند متوازن — باید داخل prisma.$transaction صدا زده شود
export async function postJournal(tx: Tx, input: PostJournalInput) {
  if (input.legs.length < 2) {
    throw FinanceErrors.ledgerImbalance()
  }

  // اعتبارسنجی legها — دقیقاً یک مقدار و هم‌خانواده با حساب
  const codes = [...new Set(input.legs.map((l) => l.account))]
  const accounts = await tx.ledgerAccount.findMany({ where: { code: { in: codes } } })
  const byCode = new Map(accounts.map((a) => [a.code, a]))

  for (const leg of input.legs) {
    const acct = byCode.get(leg.account)
    if (!acct) throw FinanceErrors.ledgerAccountMissing(leg.account)
    const hasRial = leg.amountRial != null
    const hasGold = leg.amountGold != null
    if (hasRial === hasGold) throw FinanceErrors.ledgerImbalance()
    if (hasRial && leg.amountRial! <= 0n) throw FinanceErrors.invalidAmount()
    if (hasGold && new Decimal(leg.amountGold!).lte(0)) throw FinanceErrors.invalidAmount()
    // حساب assetType=GOLD فقط leg طلایی می‌پذیرد؛ سایر حساب‌ها فقط ریال
    if (acct.assetType === 'GOLD' && !hasGold) throw FinanceErrors.ledgerImbalance()
    if (acct.assetType !== 'GOLD' && hasGold) throw FinanceErrors.ledgerImbalance()
  }

  // قانون تراز — جداگانه برای هر ارز
  let debitRial = 0n
  let creditRial = 0n
  let debitGold = new Decimal(0)
  let creditGold = new Decimal(0)
  for (const leg of input.legs) {
    if (leg.amountRial != null) {
      if (leg.side === 'DEBIT') debitRial += leg.amountRial
      else creditRial += leg.amountRial
    } else {
      const g = new Decimal(leg.amountGold!)
      if (leg.side === 'DEBIT') debitGold = debitGold.add(g)
      else creditGold = creditGold.add(g)
    }
  }
  if (debitRial !== creditRial || !debitGold.equals(creditGold)) {
    throw FinanceErrors.ledgerImbalance()
  }
  if (debitRial === 0n && debitGold.isZero()) {
    throw FinanceErrors.ledgerImbalance()
  }

  const journal = await tx.journalEntry.create({
    data: {
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
    },
  })

  for (const leg of input.legs) {
    const acct = byCode.get(leg.account)!
    const effect = await applyLegEffect(tx, leg)
    await tx.ledgerEntry.create({
      data: {
        journalEntryId: journal.id,
        ledgerAccountId: acct.id,
        entryType: leg.side,
        amountRial: leg.amountRial ?? null,
        amountGold: leg.amountGold != null ? new Decimal(leg.amountGold) : null,
        assetAccountId: effect?.assetAccountId ?? leg.assetAccountId ?? null,
        balanceAfter: effect?.balanceAfter ?? null,
      },
    })
  }

  return journal
}

// برگشت سند — سند جبرانی جدید با legهای معکوس؛ سند اصلی immutable می‌ماند
export async function reverseJournal(
  tx: Tx,
  journalId: string,
  meta: { reason: string; actorId?: string },
) {
  // قفل سند اصلی — جلوگیری از برگشت همزمان
  const originals = await tx.$queryRaw<{ id: string; status: string; reversalOf: string | null }[]>`
    SELECT id, status, "reversal_of" AS "reversalOf"
    FROM journal_entries WHERE id::text = ${journalId} FOR UPDATE
  `
  const original = originals[0]
  if (!original) throw FinanceErrors.journalNotFound()
  if (original.status !== 'POSTED' || original.reversalOf) {
    throw FinanceErrors.journalNotReversible()
  }

  const entries = await tx.ledgerEntry.findMany({
    where: { journalEntryId: journalId },
    include: { ledgerAccount: { select: { code: true } } },
  })

  const legs: JournalLeg[] = entries.map((e) => ({
    account: e.ledgerAccount.code,
    side: e.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
    amountRial: e.amountRial ?? undefined,
    amountGold: e.amountGold ?? undefined,
    assetAccountId: e.assetAccountId ?? undefined,
  }))

  const reversal = await postJournal(tx, {
    referenceType: 'REVERSAL',
    referenceId: journalId,
    description: `Reversal of ${journalId} — ${meta.reason}`,
    legs,
  })

  await tx.journalEntry.update({
    where: { id: journalId },
    data: { status: 'REVERSED' },
  })

  // پیوند برگشت به سند اصلی
  await tx.journalEntry.update({
    where: { id: reversal.id },
    data: { reversalOf: journalId },
  })

  return reversal
}
