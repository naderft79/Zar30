// Zar30 - Seed coin & bar products on existing DB (idempotent upsert)
// اجرا: npx tsx scripts/seed-coins.ts
import 'dotenv/config'
import prisma from '../src/lib/db/prisma'

const products = [
  {
    code: 'COIN_BAHAR_FULL',
    name: 'سکه بهار آزادی',
    kind: 'COIN',
    weightGrams: 8.133,
    premiumToman: 4_000_000,
    sortOrder: 1,
  },
  {
    code: 'COIN_BAHAR_HALF',
    name: 'نیم سکه بهار آزادی',
    kind: 'COIN',
    weightGrams: 4.0665,
    premiumToman: 2_500_000,
    sortOrder: 2,
  },
  {
    code: 'COIN_BAHAR_QUARTER',
    name: 'ربع سکه بهار آزادی',
    kind: 'COIN',
    weightGrams: 2.03325,
    premiumToman: 1_800_000,
    sortOrder: 3,
  },
  {
    code: 'COIN_GRAM',
    name: 'سکه گرمی',
    kind: 'COIN',
    weightGrams: 1.0166,
    premiumToman: 1_200_000,
    sortOrder: 4,
  },
  {
    code: 'BAR_1G',
    name: 'شمش ۱ گرم',
    kind: 'BAR',
    weightGrams: 1,
    premiumToman: 600_000,
    sortOrder: 5,
  },
  {
    code: 'BAR_2G',
    name: 'شمش ۲ گرم',
    kind: 'BAR',
    weightGrams: 2,
    premiumToman: 900_000,
    sortOrder: 6,
  },
  {
    code: 'BAR_5G',
    name: 'شمش ۵ گرم',
    kind: 'BAR',
    weightGrams: 5,
    premiumToman: 1_800_000,
    sortOrder: 7,
  },
  {
    code: 'BAR_10G',
    name: 'شمش ۱۰ گرم',
    kind: 'BAR',
    weightGrams: 10,
    premiumToman: 3_000_000,
    sortOrder: 8,
  },
  {
    code: 'BAR_20G',
    name: 'شمش ۲۰ گرم',
    kind: 'BAR',
    weightGrams: 20,
    premiumToman: 5_000_000,
    sortOrder: 9,
  },
]

async function main() {
  for (const p of products) {
    await prisma.coinProduct.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        weightGrams: p.weightGrams,
        premiumToman: p.premiumToman,
        sortOrder: p.sortOrder,
        active: true,
      },
      create: { ...p, active: true },
    })
    console.log(`Upserted: ${p.name}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
