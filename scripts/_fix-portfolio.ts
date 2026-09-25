// Zar30 - Dev script: اصلاح سبد تستی — کسر مازاد تومان تا ارزش کل = هدف
// سند: C ASSET_TOMAN کاربر / D LIABILITY_USER_TOMAN (مانند payout برداشت)
// Usage: pnpm exec tsx scripts/_fix-portfolio.ts <mobile> <totalValueToman>
import 'dotenv/config'
import prisma from '../src/lib/db/prisma'
import { Decimal } from '../src/lib/finance/money'
import { postJournal } from '../src/lib/finance/ledger.service'
import { ensureAssetAccount } from '../src/lib/finance/wallet.service'

async function main() {
  const [mobile, totalArg] = process.argv.slice(2)
  if (!mobile || !totalArg) {
    console.error('usage: tsx scripts/_fix-portfolio.ts <mobile> <totalValueToman>')
    process.exit(1)
  }
  const totalValue = BigInt(totalArg)

  const user = await prisma.user.findUnique({ where: { mobile } })
  if (!user) {
    console.error('user not found:', mobile)
    process.exit(1)
  }
  const price = await prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } })
  if (!price) {
    console.error('no gold price')
    process.exit(1)
  }

  const accounts = await prisma.assetAccount.findMany({
    where: { wallet: { userId: user.id } },
  })
  const tomanBal = BigInt(accounts.find((a) => a.assetType === 'TOMAN')?.balance.toString() ?? '0')
  const goldBal = accounts.find((a) => a.assetType === 'GOLD')?.balance.toString() ?? '0'
  const goldValue = new Decimal(goldBal).mul(price.sellPrice.toString())
  const liveTotal = new Decimal(tomanBal.toString()).add(goldValue)
  const excess = BigInt(liveTotal.sub(totalValue.toString()).toFixed(0, Decimal.ROUND_FLOOR))

  if (excess <= 0n) {
    console.error('no excess to remove — live total is already at/below target')
    process.exit(1)
  }
  if (excess > tomanBal) {
    console.error('excess exceeds toman balance — adjust script for gold')
    process.exit(1)
  }

  await prisma.$transaction(async (tx) => {
    const toman = await ensureAssetAccount(tx, user.id, 'TOMAN')
    const journal = await postJournal(tx, {
      referenceType: 'SEED_CORRECTION',
      referenceId: user.id,
      description: `Dev seed correction — remove ${excess.toString()} TOMAN excess`,
      legs: [
        {
          account: 'ASSET_TOMAN',
          side: 'CREDIT',
          amountToman: excess,
          assetAccountId: toman.id,
        },
        { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: excess },
      ],
    })
    console.log('correction journal:', journal.id)
  })

  const after = await prisma.assetAccount.findMany({
    where: { wallet: { userId: user.id } },
  })
  const t2 = BigInt(after.find((a) => a.assetType === 'TOMAN')?.balance.toString() ?? '0')
  const g2 = after.find((a) => a.assetType === 'GOLD')?.balance.toString() ?? '0'
  const live2 =
    t2 + BigInt(new Decimal(g2).mul(price.sellPrice.toString()).toFixed(0, Decimal.ROUND_FLOOR))
  console.log(
    JSON.stringify({
      tomanBalance: t2.toString(),
      goldBalance: g2,
      liveTotalValue: live2.toString(),
      target: totalValue.toString(),
      diff: (live2 - totalValue).toString(),
    }),
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
