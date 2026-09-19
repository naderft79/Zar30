// ============================================
// Zar30 - Prisma Client Singleton (Prisma 7)
// ============================================
// Prisma 7 از Driver Adapters استفاده می کند
// PostgreSQL adapter: @prisma/adapter-pg
// ============================================

import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ساخت adapter برای PostgreSQL
function createAdapter() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }
  return new PrismaPg({ connectionString })
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
