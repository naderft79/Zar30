// ============================================
// Zarnama - Health Check Endpoint
// ============================================
// GET /api/v1/health
// Liveness + Readiness checks
// ============================================

import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import redis from '@/lib/redis/client'
import { ok, fail, withErrorHandler } from '@/lib/api/response'

// GET /api/v1/health — Liveness check
export const GET = withErrorHandler(async () => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {}

  // Database check
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - start }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Redis check
  try {
    const start = Date.now()
    await redis.ping()
    checks.redis = { status: 'ok', latencyMs: Date.now() - start }
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')

  return NextResponse.json(
    {
      success: allOk,
      data: {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        checks,
      },
    },
    { status: allOk ? 200 : 503 },
  )
})
