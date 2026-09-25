// Zar30 - Dev script: سبد دارایی تستی واقعی برای کاربر
// ارزش کل = تومان + گرم طلا × قیمت فروش لحظه‌ای — کاملاً live و ledger-based
// Usage: pnpm exec tsx scripts/_seed-portfolio.ts <mobile> <totalValueToman> [tomanPart]
import 'dotenv/config'
import prisma from '../src/lib/db/prisma'
import { Decimal, floorGold } from '../src/lib/finance/money'
import { postJournal } from '../src/lib/finance/ledger.service'
import { ensureAssetAccount } from '../src/lib/finance/wallet.service'
import { requestDeposit, creditDepositCore } from '../src/lib/finance/deposit.service'

async function main() {
  const [mobile, totalArg, tomanArg] = process.argv.slice(2)
  if (!mobile || !totalArg) {
    console.error('usage: tsx scripts/_seed-portfolio.ts <mobile> <totalValueToman> [tomanPart]')
    process.exit(1)
  }
  const totalValue = BigInt(totalArg)
  const tomanPart = BigInt(tomanArg ?? '100000000')

  const user = await prisma.user.findUnique({ where: { mobile } })
  if (!user) {
    console.error('user not found:', mobile)
    process.exit(1)
  }

  const price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
  if (!price || price.sellPrice <= 0n) {
    console.error('no valid gold price — record a price first')
    process.exit(1)
  }
  if (tomanPart >= totalValue) {
    console.error('tomanPart must be less than totalValue')
    process.exit(1)
  }

  const goldValueTarget = new Decimal((totalValue - tomanPart).toString())
  const goldGrams = floorGold(goldValueTarget.div(price.sellPrice.toString()))

  // تومان — از مسیر رسمی deposit (journal + transaction)
  const dep = await requestDeposit(
    { userId: user.id, kycLevel: user.kycLevel },
    { amount: tomanPart },
  )

  await prisma.$transaction(async (tx) => {
    await creditDepositCore(tx, dep.id)

    // طلا — اعتبار از موجودی پلتفرم (مانند legs خرید)
    const gold = await ensureAssetAccount(tx, user.id, 'GOLD')
    const journal = await postJournal(tx, {
      referenceType: 'SEED_PORTFOLIO',
      referenceId: user.id,
      description: `Dev seed — ${goldGrams.toString()}g gold credit`,
      legs: [
        {
          account: 'ASSET_GOLD',
          side: 'DEBIT',
          amountGold: goldGrams.toString(),
          assetAccountId: gold.id,
        },
        {
          account: 'LIABILITY_GOLD_INVENTORY',
          side: 'CREDIT',
          amountGold: goldGrams.toString(),
        },
      ],
    })
    console.log('gold journal:', journal.id)
  })

  // verify — ارزش لحظه‌ای واقعی
  const accounts = await prisma.assetAccount.findMany({
    where: { wallet: { userId: user.id } },
  })
  const toman = accounts.find((a) => a.assetType === 'TOMAN')
  const gold = accounts.find((a) => a.assetType === 'GOLD')
  const liveValue =
    BigInt(toman?.balance.toString() ?? '0') +
    BigInt(new Decimal(gold?.balance.toString() ?? '0').mul(price.sellPrice.toString()).toFixed(0))

  console.log(
    JSON.stringify(
      {
        mobile,
        tomanBalance: toman?.balance.toString(),
        goldBalance: gold?.balance.toString(),
        sellPriceUsed: price.sellPrice.toString(),
        liveTotalValue: liveValue.toString(),
        target: totalValue.toString(),
        diff: (liveValue - totalValue).toString(),
      },
      null,
      2,
    ),
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
