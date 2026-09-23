import 'dotenv/config'
import prisma from '../src/lib/db/prisma'
async function main() {
  const mobile = process.argv[2] ?? '09120000000'
  const user = await prisma.user.update({
    where: { mobile },
    data: { failedLoginAttempts: 0, lockedUntil: null },
    select: { mobile: true, failedLoginAttempts: true, lockedUntil: true, status: true },
  })
  console.log('unlocked:', JSON.stringify(user))
}
main().finally(() => prisma.$disconnect())
