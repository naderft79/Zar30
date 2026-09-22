// اسکریپت موقت dev — اعتبار موجودی تومانی کاربر از مسیر رسمی deposit + ledger
// Usage: pnpm exec tsx scripts/_credit-user.ts <mobile> <amountToman>
import 'dotenv/config'
import prisma from '../src/lib/db/prisma'
import { requestDeposit, creditDepositCore } from '../src/lib/finance/deposit.service'

async function main() {
  const [mobile, amountArg] = process.argv.slice(2)
  if (!mobile || !amountArg) {
    console.error('usage: tsx scripts/_credit-user.ts <mobile> <amountToman>')
    process.exit(1)
  }
  const amount = BigInt(amountArg)

  const user = await prisma.user.findUnique({ where: { mobile } })
  if (!user) {
    console.error('user not found:', mobile)
    process.exit(1)
  }

  const req = await requestDeposit({ userId: user.id, kycLevel: user.kycLevel }, { amount })
  const credited = await prisma.$transaction((tx) => creditDepositCore(tx, req.id))
  const account = await prisma.assetAccount.findFirst({
    where: { wallet: { userId: user.id }, assetType: 'TOMAN' },
  })
  console.log(
    JSON.stringify({
      deposit: req.id,
      status: credited.updated.status,
      newBalance: account?.balance.toString(),
    }),
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
