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

  // Object Storage (MinIO dev / S3 production) — مدارک KYC خصوصی
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('zar30'),
  S3_ACCESS_KEY: z.string().default('zar30'),
  S3_SECRET_KEY: z.string().default('zar30_dev_password'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // KYC — کلید AES-256-GCM برای مدارک و داده‌های بانکی (64 hex = 32 bytes)
  KYC_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'KYC_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .default('5a1f3c9e7b2d4a6081f4c6e9a3b5d7f02e8c4a6b9d1f3e5c7a9b0d2f4e6c8a0b'),

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
