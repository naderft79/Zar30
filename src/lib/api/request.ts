// ============================================
// Zarnama - API Request Helpers (Phase 2)
// ============================================

import type { ZodType } from 'zod'
import { ApiError } from '@/lib/errors/api-error'

// Parse + validate body — خطای واضح زبان فارسی به کلاینت
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }
  return parsed.data
}

// استخراج IP کلاینت — پشت reverse proxy از x-forwarded-for
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return req.headers.get('x-real-ip') ?? undefined
}

export function getSessionMeta(req: Request, deviceInfo?: string) {
  return {
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent') ?? undefined,
    deviceInfo,
  }
}
