import 'dotenv/config'
import prisma from '../src/lib/db/prisma'
async function main() {
  const admins = await prisma.adminUser.findMany({
    include: { user: { select: { mobile: true } } },
  })
  for (const a of admins) console.log(a.user.mobile, a.role, a.active)
  console.log('total:', admins.length)
}
main().finally(() => prisma.$disconnect())
