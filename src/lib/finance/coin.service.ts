// ============================================
// Zar30 - Coin & Bar Service (سکه و شمش)
// ============================================
// تبدیل طلای آب‌شده به سکه/شمش در یک DB transaction:
//   قیمت هر واحد = وزن × قیمت فروش طلا + اجرت (premiumToman)
//   کاربر: طلا به اندازه وزن + تومان به اندازه اجرت می‌پردازد
//   journalها (مانند sell/buy):
//     طلا:  C ASSET_GOLD کاربر / D LIABILITY_GOLD_INVENTORY
//     اجرت: C ASSET_TOMAN کاربر / D LIABILITY_USER_TOMAN
//           D ASSET_PLATFORM_TOMAN / C REVENUE_FEE
//   دارایی در CoinHolding تجمیع می‌شود — سکه/شمش در امانت پلتفرم
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { Decimal, goldToToman } from './money'
import { FinanceErrors } from './errors'
import { postJournal } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { getExecutablePrice } from './pricing.service'
import { notifyFinancial } from './notify'
import type { KycLevel } from '@/generated/prisma'

const MAX_UNITS_PER_ORDER = 20

function productRow(
  p: {
    id: string
    code: string
    name: string
    kind: string
    weightGrams: Decimal
    premiumToman: bigint
  },
  sellPrice: bigint,
) {
  const unitPrice = goldToToman(p.weightGrams, sellPrice) + p.premiumToman
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    kind: p.kind,
    weightGrams: p.weightGrams.toString(),
    premiumToman: p.premiumToman.toString(),
    unitPriceToman: unitPrice.toString(),
  }
}

// لیست محصولات فعال — قیمت در دسترس نبود unitPriceToman=null (هرگز قیمت ساختگی نه)
export async function listCoinProducts(sellPrice: bigint | null) {
  const products = await prisma.coinProduct.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { weightGrams: 'asc' }],
  })
  return products.map((p) =>
    sellPrice != null ? productRow(p, sellPrice) : { ...productRow(p, 0n), unitPriceToman: null },
  )
}

export async function listUserCoinHoldings(userId: string, sellPrice: bigint | null) {
  const holdings = await prisma.coinHolding.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { updatedAt: 'desc' },
  })
  return holdings.map((h) => ({
    id: h.id,
    quantity: h.quantity,
    product:
      sellPrice != null
        ? productRow(h.product, sellPrice)
        : {
            id: h.product.id,
            code: h.product.code,
            name: h.product.name,
            kind: h.product.kind,
            weightGrams: h.product.weightGrams.toString(),
            premiumToman: h.product.premiumToman.toString(),
            unitPriceToman: null,
          },
  }))
}

// تبدیل — قفل طلا و تومان در یک transaction اتمیک
export async function convertToCoin(
  ctx: { userId: string; kycLevel: KycLevel },
  input: { productId: string; quantity: number },
) {
  if (ctx.kycLevel === 'LEVEL_0') {
    throw FinanceErrors.kycRequired('برای تبدیل سکه، احراز هویت لازم است')
  }
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > MAX_UNITS_PER_ORDER
  ) {
    throw FinanceErrors.invalidAmount(`تعداد باید بین ۱ تا ${MAX_UNITS_PER_ORDER} باشد`)
  }
  const product = await prisma.coinProduct.findUnique({ where: { id: input.productId } })
  if (!product || !product.active) {
    throw ApiError.notFound('محصول یافت نشد یا غیرفعال است')
  }

  // قیمت لحظه‌ای برای نمایش/ثبت — خود مبلغ طلا از وزن محصول می‌آید
  const price = await getExecutablePrice()
  const goldNeeded = product.weightGrams.mul(input.quantity)
  const feeToman = product.premiumToman * BigInt(input.quantity)
  const unitPrice = goldToToman(product.weightGrams, price.sellPrice) + product.premiumToman

  const result = await prisma.$transaction(async (tx) => {
    const gold = await ensureAssetAccount(tx, ctx.userId, 'GOLD')
    const toman = await ensureAssetAccount(tx, ctx.userId, 'TOMAN')

    const journal = await postJournal(tx, {
      referenceType: 'COIN_CONVERT',
      referenceId: product.id,
      description: `Coin convert — ${input.quantity}x ${product.code}`,
      legs: [
        // خروج طلای آب‌شده کاربر به موجودی پلتفرم
        {
          account: 'ASSET_GOLD',
          side: 'CREDIT',
          amountGold: goldNeeded.toString(),
          assetAccountId: gold.id,
        },
        { account: 'LIABILITY_GOLD_INVENTORY', side: 'DEBIT', amountGold: goldNeeded.toString() },
        // پرداخت اجرت تومانی
        {
          account: 'ASSET_TOMAN',
          side: 'CREDIT',
          amountToman: feeToman,
          assetAccountId: toman.id,
        },
        { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: feeToman },
        { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: feeToman },
        { account: 'REVENUE_FEE', side: 'CREDIT', amountToman: feeToman },
      ],
    })

    const holding = await tx.coinHolding.upsert({
      where: { userId_productId: { userId: ctx.userId, productId: product.id } },
      create: {
        userId: ctx.userId,
        productId: product.id,
        quantity: input.quantity,
        journalEntryId: journal.id,
      },
      update: { quantity: { increment: input.quantity }, journalEntryId: journal.id },
    })

    return { holding, journalId: journal.id }
  })

  notifyFinancial(ctx.userId, 'coin_converted', 'تبدیل سکه/شمش انجام شد', '', {
    productName: product.name,
    quantity: input.quantity,
    goldAmount: goldNeeded.toString(),
  })

  return {
    holdingId: result.holding.id,
    quantity: result.holding.quantity,
    goldSpent: goldNeeded.toString(),
    feePaid: feeToman.toString(),
    unitPriceToman: unitPrice.toString(),
  }
}
