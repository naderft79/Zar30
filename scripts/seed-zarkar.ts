// Zar30 - Seed ZarKar plans on existing DB
// اجرا: npx tsx scripts/seed-zarkar.ts
// طرح‌های خالی (بدون موقعیت) جایگزین می‌شوند — موقعیت‌های موجود دست‌نخورده می‌مانند
import 'dotenv/config'
import prisma from '../src/lib/db/prisma'

const plans = [
  { name: 'زرکار ۳ ماهه', durationDays: 90, rate: 3 },
  { name: 'زرکار ۶ ماهه', durationDays: 180, rate: 8 },
  { name: 'زرکار ۱۲ ماهه', durationDays: 365, rate: 20 },
]

async function main() {
  const removed = await prisma.investmentPlan.deleteMany({
    where: { positions: { none: {} } },
  })
  console.log(`Removed ${removed.count} empty plans`)
  for (const p of plans) {
    await prisma.investmentPlan.create({
      data: {
        name: p.name,
        durationDays: p.durationDays,
        minGoldGram: 0.1,
        interestRateType: 'FIXED',
        rate: p.rate,
        active: true,
      },
    })
    console.log(`Created: ${p.name}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
