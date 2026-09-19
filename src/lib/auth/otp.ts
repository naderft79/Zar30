// ============================================
// Zar30 - OTP Security (Phase 2)
// ============================================
// Server-generated / Expiring / Attempt-limited /
// Rate-limited (در لایه API) / Replay-resistant / Hashed (بدون plaintext)
// ============================================

import { createHash, randomInt } from 'crypto'
import prisma from '@/lib/db/prisma'
import { env } from '@/lib/config/env'
import { ApiError } from '@/lib/errors/api-error'
import { smsService } from '@/lib/sms/sms-service'

export type OtpPurpose = 'register' | 'login' | 'reset'

// کد هرگز plaintext ذخیره نمی‌شود — hash با pepper
function hashOtp(code: string): string {
  return createHash('sha256')
    .update(code + env.OTP_PEPPER)
    .digest('hex')
}

// تولید کد ۶ رقمی با randomInt (cryptographically secure)
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export async function sendOtp(mobile: string, purpose: OtpPurpose) {
  // Cooldown بین ارسال‌ها — جلوگیری از SMS bombing
  const last = await prisma.otpCode.findFirst({
    where: { mobile, purpose },
    orderBy: { createdAt: 'desc' },
  })
  if (last && !last.consumedAt) {
    const elapsedSeconds = (Date.now() - last.createdAt.getTime()) / 1000
    if (elapsedSeconds < env.OTP_RESEND_COOLDOWN_SECONDS) {
      throw ApiError.tooManyRequests(
        `برای ارسال مجدد ${env.OTP_RESEND_COOLDOWN_SECONDS} ثانیه صبر کنید`,
      )
    }
  }

  const code = generateOtpCode()
  await prisma.otpCode.create({
    data: {
      mobile,
      purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + env.OTP_TTL_SECONDS * 1000),
    },
  })
  await smsService.sendOtp(mobile, code)
  return {
    expiresInSeconds: env.OTP_TTL_SECONDS,
    resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  }
}

export async function verifyOtp(mobile: string, purpose: OtpPurpose, code: string) {
  const record = await prisma.otpCode.findFirst({
    where: { mobile, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) {
    throw ApiError.badRequest('کد تاییدی برای این شماره یافت نشد — ابتدا درخواست کد بدهید')
  }
  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest('کد تایید منقضی شده است — کد جدید درخواست کنید')
  }
  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.tooManyRequests(
      'تعداد تلاش‌های ناموفق بیش از حد مجاز است — کد جدید درخواست کنید',
    )
  }

  if (record.codeHash !== hashOtp(code)) {
    // افزایش اتمیک attempts — جلوگیری از race در brute force
    await prisma.otpCode.updateMany({
      where: { id: record.id, consumedAt: null, attempts: { lt: env.OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    })
    throw ApiError.badRequest('کد تایید نادرست است')
  }

  // مصرف اتمیک — Replay resistant: کد مصرف‌شده دوباره قابل استفاده نیست
  const consumed = await prisma.otpCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  if (consumed.count === 0) {
    throw ApiError.badRequest('کد قبلاً استفاده شده است')
  }
}
