// ============================================
// Zar30 - Environment Configuration
// ============================================
// Validates all env vars at startup with Zod
// ============================================

import { z } from 'zod'

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_ISSUER: z.string().default('zar30'),
  JWT_AUDIENCE: z.string().default('zar30-users'),

  // Password
  BCRYPT_COST: z.coerce.number().default(12),
  PASSWORD_PEPPER: z.string().min(1).default('dev_pepper'),

  // OTP
  OTP_TTL_SECONDS: z.coerce.number().default(120),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_PEPPER: z.string().default('dev_otp_pepper'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Business config (PENDING BUSINESS DECISION - dev defaults only)
  BUSINESS_SPREAD_PERCENT: z.coerce.number().default(0.5),
  BUSINESS_TRADING_FEE_PERCENT: z.coerce.number().default(0.5),
})

export type Env = z.infer<typeof envSchema>

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  cachedEnv = result.data
  return cachedEnv
}

export const env = getEnv()
