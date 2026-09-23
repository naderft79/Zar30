import 'dotenv/config'
import { redis } from '../src/lib/redis/client'
import prisma from '../src/lib/db/prisma'
async function main() {
  const mobile = process.argv[2] ?? '09120000000'
  await new Promise<void>((resolve, reject) => {
    if (redis.status === 'ready') return resolve()
    redis.once('ready', resolve)
    redis.once('error', reject)
    setTimeout(() => reject(new Error('redis connect timeout')), 8000)
  })
  const keys = await redis.keys('ratelimit:*')
  const targets = keys.filter((k) => k.includes(mobile) || k.includes('auth.login'))
  for (const k of targets) {
    await redis.del(k)
    console.log('deleted:', k)
  }
  await prisma.user.updateMany({
    where: { mobile },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })
  console.log('done')
}
main().finally(async () => {
  redis.disconnect()
  await prisma.$disconnect()
})
