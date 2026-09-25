// ============================================
// Zar30 - Internal Transfer Service (Assets v2)
// ============================================
// انتقال طلا/تومان بین دو کاربر زرسی — در یک DB transaction:
//   ۱) recipient با موبایل resolve می‌شود (خود-انتقال ممنوع)
//   ۲) journal متقارن: CREDIT حساب فرستنده + DEBIT حساب گیرنده
//   ۳) رکورد InternalTransfer + Transaction(TRANSFER) برای هر دو سمت
//   ۴) kind=GIFT → پیام هدیه + notification متفاوت
// موجودی هرگز منفی نمی‌شود (قانون ledger) — row-lock داخلی ledger فعال است
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { Decimal } from './money'
import { FinanceErrors } from './errors'
import { postJournal, type JournalLeg } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { enforceLimit } from './limit.service'
import { notifyFinancial } from './notify'

const MAX_TOMAN_TRANSFER = BigInt(process.env.MAX_TRANSFER_TOMAN ?? '500000000')
const MAX_GOLD_TRANSFER_G = new Decimal(process.env.MAX_TRANSFER_GOLD ?? '100')

export async function resolveRecipient(mobile: string, senderId: string) {
  const recipient = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true, firstName: true, lastName: true, status: true },
  })
  if (!recipient) throw ApiError.notFound('کاربری با این شماره موبایل یافت نشد')
  if (recipient.id === senderId) throw ApiError.badRequest('انتقال به خود امکان‌پذیر نیست')
  if (recipient.status !== 'ACTIVE') throw ApiError.badRequest('حساب گیرنده فعال نیست')
  return recipient
}

export async function createTransfer(
  senderId: string,
  input: {
    recipientMobile: string
    assetType: 'TOMAN' | 'GOLD'
    tomanAmount?: bigint
    goldAmount?: string
    kind: 'TRANSFER' | 'GIFT'
    giftMessage?: string
  },
) {
  const recipient = await resolveRecipient(input.recipientMobile, senderId)

  if (input.assetType === 'TOMAN') {
    if (!input.tomanAmount || input.tomanAmount <= 0n) throw FinanceErrors.invalidAmount()
    if (input.tomanAmount > MAX_TOMAN_TRANSFER) {
      throw ApiError.badRequest('مبلغ انتقال از سقف مجاز بیشتر است')
    }
  } else {
    const g = new Decimal(input.goldAmount ?? '0')
    if (g.lte(0)) throw FinanceErrors.invalidAmount()
    if (g.gt(MAX_GOLD_TRANSFER_G)) {
      throw ApiError.badRequest('مقدار طلای انتقال از سقف مجاز بیشتر است')
    }
  }

  // قوانین محدودیت admin (LimitRule) — سقف انتقال بر اساس سطح KYC فرستنده
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { kycLevel: true },
  })
  if (sender) {
    await enforceLimit(senderId, sender.kycLevel, 'TRANSFER', {
      toman: input.tomanAmount,
      gold: input.goldAmount,
    })
  }

  const transfer = await prisma.$transaction(async (tx) => {
    const senderAcct = await ensureAssetAccount(tx, senderId, input.assetType)
    const recipientAcct = await ensureAssetAccount(tx, recipient.id, input.assetType)

    const legs: JournalLeg[] =
      input.assetType === 'TOMAN'
        ? [
            {
              account: 'ASSET_TOMAN',
              side: 'CREDIT',
              amountToman: input.tomanAmount!,
              assetAccountId: senderAcct.id,
            },
            {
              account: 'ASSET_TOMAN',
              side: 'DEBIT',
              amountToman: input.tomanAmount!,
              assetAccountId: recipientAcct.id,
            },
          ]
        : [
            {
              account: 'ASSET_GOLD',
              side: 'CREDIT',
              amountGold: input.goldAmount!,
              assetAccountId: senderAcct.id,
            },
            {
              account: 'ASSET_GOLD',
              side: 'DEBIT',
              amountGold: input.goldAmount!,
              assetAccountId: recipientAcct.id,
            },
          ]

    const record = await tx.internalTransfer.create({
      data: {
        senderId,
        recipientId: recipient.id,
        assetType: input.assetType,
        tomanAmount: input.assetType === 'TOMAN' ? input.tomanAmount! : null,
        goldAmount: input.assetType === 'GOLD' ? new Decimal(input.goldAmount!) : null,
        kind: input.kind,
        giftMessage: input.kind === 'GIFT' ? (input.giftMessage ?? null) : null,
      },
    })

    const journal = await postJournal(tx, {
      referenceType: 'INTERNAL_TRANSFER',
      referenceId: record.id,
      description:
        input.assetType === 'TOMAN'
          ? `Internal transfer ${input.tomanAmount}t ${senderId} -> ${recipient.id}`
          : `Internal transfer ${input.goldAmount}g ${senderId} -> ${recipient.id}`,
      legs,
    })

    await tx.internalTransfer.update({
      where: { id: record.id },
      data: { journalEntryId: journal.id },
    })
    return record
  })

  const isGift = input.kind === 'GIFT'
  const amountLabel =
    input.assetType === 'TOMAN'
      ? `${input.tomanAmount!.toLocaleString('en')} toman`
      : `${input.goldAmount}g gold`
  notifyFinancial(senderId, 'transfer_sent', isGift ? 'هدیه شما ارسال شد' : 'انتقال انجام شد', '', {
    transferId: transfer.id,
    amount: amountLabel,
  })
  notifyFinancial(
    recipient.id,
    'transfer_received',
    isGift ? 'هدیه طلا/تومان دریافت کردید' : 'انتقال دریافت کردید',
    input.giftMessage ?? '',
    { transferId: transfer.id, amount: amountLabel, gift: isGift },
  )

  return transfer
}

export async function listUserTransfers(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.internalTransfer.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { firstName: true, lastName: true, mobile: true } },
        recipient: { select: { firstName: true, lastName: true, mobile: true } },
      },
    }),
    prisma.internalTransfer.count({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    }),
  ])
  return { items, total }
}
