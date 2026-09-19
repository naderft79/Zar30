import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// ============================================
// Zar30 - Prisma 7 Configuration
// ============================================
// Database connection is configured here (not in schema.prisma)
// See: https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference
// ============================================

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
