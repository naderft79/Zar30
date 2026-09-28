// ============================================
// Zar30 - /api/v1/zareesi-cards/[id]/cancel
// ============================================
// POST → لغو سفارش کارت زرسی توسط کاربر (فقط PENDING) + برگشت کامل کارمزد
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import prisma from '@/lib/db/prisma'
import { ensureAssetAccount } from '@/lib/finance/wallet.service'
import { postJournal } from '@/lib/finance/ledger.service'
import { notifyFinancial } from '@/lib/finance/notify'
import { toAuditData } from '@/lib/audit/audit'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req)
    await checkRateLimit('wallet.write', auth.userId)
    const { id } = await ctx.params

    const card = await prisma.zareesiCard.findUnique({ where: { id } })
    if (!card || card.userId !== auth.userId) throw ApiError.notFound('کارت یافت نشد')
    if (card.status !== 'PENDING') {
      throw ApiError.badRequest('فقط سفارش‌های در انتظار تایید قابل لغو هستند')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const gold = await ensureAssetAccount(tx, auth.userId, 'GOLD')
      await postJournal(tx, {
        referenceType: 'ZAREESI_REFUND',
        referenceId: card.id,
        description: `Zareesi card cancelled refund — ${card.feeGold}g`,
        legs: [
          {
            account: 'ASSET_GOLD',
            side: 'DEBIT',
            amountGold: card.feeGold,
            assetAccountId: gold.id,
          },
          { account: 'LIABILITY_GOLD_INVENTORY', side: 'CREDIT', amountGold: card.feeGold },
        ],
      })
      if (card.feeToman > 0n) {
        const toman = await ensureAssetAccount(tx, auth.userId, 'TOMAN')
        await postJournal(tx, {
          referenceType: 'ZAREESI_REFUND',
          referenceId: card.id,
          description: `Zareesi shipping refund — ${card.feeToman.toString()} TOMAN`,
          legs: [
            {
              account: 'ASSET_TOMAN',
              side: 'DEBIT',
              amountToman: card.feeToman,
              assetAccountId: toman.id,
            },
            { account: 'ASSET_PLATFORM_TOMAN', side: 'CREDIT', amountToman: card.feeToman },
          ],
        })
      }
      const u = await tx.zareesiCard.update({
        where: { id: card.id },
        data: { status: 'REJECTED', rejectedReason: 'لغو توسط کاربر' },
      })
      await tx.auditLog.create({
        data: toAuditData({
          actorType: 'user',
          actorId: auth.userId,
          action: 'zareesi.cancel',
          entityType: 'ZareesiCard',
          entityId: card.id,
          before: { status: card.status },
          after: { status: 'REJECTED' },
          targetUserId: auth.userId,
        }),
      })
      return {
        ...u,
        feeGold: String(u.feeGold),
        feeToman: String(u.feeToman),
      }
    })

    notifyFinancial(
      auth.userId,
      'zareesi_card_cancelled',
      'سفارش کارت زرسی لغو شد',
      'کارمزد به کیف پول شما برگشت خورد.',
      {
        zareesiCardId: card.id,
      },
    )

    return ok({ card: updated })
  },
)
