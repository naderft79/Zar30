// ============================================
// Zar30 - Create/Promote Admin User (Ops Script)
// ============================================
// ساخت کاربر جدید یا ارتقای کاربر موجود به ادمین
// Usage: pnpm exec tsx scripts/create-admin.ts <mobile> <password> [role]
// Example: pnpm exec tsx scripts/create-admin.ts 09120000000 'Secure@1234' SUPER_ADMIN
// ============================================

import 'dotenv/config'
import { AdminRole } from '../src/generated/prisma'
import prisma from '../src/lib/db/prisma'
import { hashPassword } from '../src/lib/auth/password'

const REFERRAL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)]
    }
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate unique referral code')
}

async function main() {
  const [mobile, password, roleArg = 'SUPER_ADMIN'] = process.argv.slice(2)

  if (!mobile || !password) {
    console.error('Usage: pnpm exec tsx scripts/create-admin.ts <mobile> <password> [role]')
    process.exit(1)
  }
  if (!/^09\d{9}$/.test(mobile)) {
    console.error('Invalid mobile format — expected 09xxxxxxxxx')
    process.exit(1)
  }
  const role = roleArg as AdminRole
  if (!Object.values(AdminRole).includes(role)) {
    console.error(`Invalid role — expected one of: ${Object.values(AdminRole).join(', ')}`)
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  // کاربر موجود → به‌روزرسانی رمز و اطمینان از verify؛ کاربر جدید → ساخت verified
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.upsert({
    where: { mobile },
    update: { passwordHash, mobileVerifiedAt: new Date(), status: 'ACTIVE' },
    create: {
      mobile,
      passwordHash,
      referralCode: await generateUniqueReferralCode(),
      kycLevel: 'LEVEL_1',
      mobileVerifiedAt: new Date(),
    },
  })

  const admin = await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: { role, active: true },
    create: { userId: user.id, role, permissions: {} },
  })

  console.log(`Admin ready: mobile=${user.mobile} role=${admin.role} active=${admin.active}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
