// ============================================
// Zarnama - SMS Service (Phase 2)
// ============================================
// Provider Interface از ابتدا — Production به Mock وابسته نیست
// Development Mock: کد OTP در لاگ + Redis (فقط dev) برای تست E2E
// ============================================

import { redis } from '@/lib/redis/client'
import { logger } from '@/lib/logger/logger'

export interface SmsService {
  sendOtp(mobile: string, code: string): Promise<void>
}

function maskMobile(mobile: string): string {
  return mobile.length === 11 ? `${mobile.slice(0, 4)}***${mobile.slice(7)}` : '***'
}

// ============================================
// Development Mock — واضحاً MOCK؛ فقط با SMS_PROVIDER=mock فعال می‌شود
// ============================================
class DevMockSmsProvider implements SmsService {
  async sendOtp(mobile: string, code: string): Promise<void> {
    logger.warn(
      { mobile: maskMobile(mobile) },
      `[Development Mock SMS] OTP code for ${mobile}: ${code}`,
    )
    // نگه‌داری موقت در Redis برای development/E2E — TTL 5 دقیقه
    await redis.set(`devotp:${mobile}`, code, 'EX', 300)
  }
}

// ============================================
// Kavenegar — Production provider (PENDING BUSINESS DECISION: provider نهایی)
// ============================================
class KavenegarProvider implements SmsService {
  async sendOtp(mobile: string, code: string): Promise<void> {
    const apiKey = process.env.SMS_API_KEY
    if (!apiKey || apiKey.startsWith('your_')) {
      throw new Error('SMS_API_KEY is not configured for production SMS provider')
    }
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`
    const params = new URLSearchParams({
      receptor: mobile,
      token: code,
      template: 'zarnama-otp',
    })
    const response = await fetch(`${url}?${params}`, { method: 'GET' })
    if (!response.ok) {
      logger.error({ status: response.status }, 'SMS provider request failed')
      throw new Error('Failed to send SMS')
    }
  }
}

// انتخاب Provider از env — در Production واقعی باید SMS_PROVIDER=kavenegar باشد
const provider = process.env.SMS_PROVIDER
export const smsService: SmsService =
  provider === 'kavenegar' ? new KavenegarProvider() : new DevMockSmsProvider()

if (provider !== 'kavenegar') {
  logger.warn(
    { provider: provider ?? 'unset' },
    'SMS provider is Development Mock — do not use in production',
  )
}
if (process.env.NODE_ENV === 'production' && provider !== 'kavenegar') {
  logger.error('Production build is running with Development Mock SMS — set SMS_PROVIDER=kavenegar')
}
