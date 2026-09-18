// ============================================
// Zarnama - Auth Service (Phase 2)
// ============================================
// منطق کسب‌وکار احراز هویت — Registration, Login, OTP, Password,
// Session Management, Brute Force Protection, Audit
// ============================================

import type { User } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { sendOtp, verifyOtp } from '@/lib/auth/otp'
import {
  createSession,
  revokeAllOtherSessions,
  revokeAllUserSessions,
  revokeSession,
  type SessionMeta,
} from '@/lib/auth/session'
import { signAccessToken } from '@/lib/auth/jwt'
import { writeAudit } from '@/lib/audit/audit'
import type {
  ChangePasswordInput,
  LoginInput,
  OtpSendInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/lib/validators/auth'

// مدت قفل حساب پس از تلاش‌های ناموفق
const LOCK_DURATION_MINUTES = 15
const MAX_FAILED_ATTEMPTS = 5

// پیام خطای generic — افشای اینکه کدام فیلد نادرست است ممنوع
const INVALID_CREDENTIALS = 'شماره موبایل یا رمز عبور نادرست است'

const REFERRAL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)]
    }
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate unique referral code')
}

export interface AuthResult {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export interface PublicUser {
  id: string
  mobile: string
  kycLevel: string
  status: string
  createdAt: Date
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    mobile: user.mobile,
    kycLevel: user.kycLevel,
    status: user.status,
    createdAt: user.createdAt,
  }
}

// ============================================
// Registration
// ============================================
export async function register(input: RegisterInput, meta: SessionMeta) {
  const existing = await prisma.user.findUnique({ where: { mobile: input.mobile } })
  if (existing && existing.status === 'ACTIVE') {
    throw ApiError.conflict('این شماره موبایل قبلاً ثبت شده است — وارد شوید')
  }

  // Referral (اختیاری) — self-referral در این مرحله ممکن نیست (کاربر هنوز وجود ندارد)
  let referredById: string | undefined
  if (input.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: input.referralCode },
      select: { id: true },
    })
    referredById = referrer?.id
  }

  const passwordHash = await hashPassword(input.password)
  const user = await prisma.user.create({
    data: {
      mobile: input.mobile,
      passwordHash,
      referralCode: await generateUniqueReferralCode(),
      referredById,
    },
  })

  await sendOtp(user.mobile, 'register')
  await writeAudit({
    actorType: 'user',
    actorId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  logger.info({ userId: user.id }, 'User registered')

  return { userId: user.id, otpSent: true }
}

// تایید ثبت‌نام با OTP → سطح ۱ KYC (تایید موبایل)
export async function verifyRegisterOtp(mobile: string, code: string, meta: SessionMeta) {
  await verifyOtp(mobile, 'register', code)
  const user = await prisma.user.findUnique({ where: { mobile } })
  if (!user) throw ApiError.notFound('حسابی با این شماره یافت نشد')

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { kycLevel: 'LEVEL_1', mobileVerifiedAt: new Date() },
  })

  await writeAudit({
    actorType: 'user',
    actorId: user.id,
    action: 'MOBILE_VERIFIED',
    entityType: 'user',
    entityId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { verified: true, kycLevel: updated.kycLevel }
}

// ============================================
// Login — با Brute Force Protection
// ============================================
export async function login(input: LoginInput, meta: SessionMeta): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { mobile: input.mobile } })

  if (!user || user.status === 'DELETED') {
    throw ApiError.unauthorized(INVALID_CREDENTIALS)
  }
  if (user.status === 'BLOCKED') {
    throw ApiError.forbidden('حساب شما مسدود شده است — با پشتیبانی تماس بگیرید')
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw ApiError.tooManyRequests(`حساب شما موقتاً قفل شده است. ${minutes} دقیقه دیگر تلاش کنید`)
  }
  if (!user.mobileVerifiedAt) {
    throw ApiError.forbidden('شماره موبایل شما تایید نشده است — دوباره ثبت‌نام کنید')
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash)
  if (!passwordValid) {
    const attempts = user.failedLoginAttempts + 1
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60000) : null,
      },
    })
    await writeAudit({
      actorType: 'user',
      actorId: user.id,
      action: shouldLock ? 'SECURITY_ACCOUNT_LOCKED' : 'SECURITY_LOGIN_FAILED',
      entityType: 'user',
      entityId: user.id,
      after: { attempts, locked: shouldLock },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    logger.warn({ userId: user.id, attempts, locked: shouldLock }, 'Failed login attempt')
    // پیام generic — قفل شدن زودتر فاش نشود
    throw ApiError.unauthorized(INVALID_CREDENTIALS)
  }

  // موفقیت — reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  const { session, refreshToken } = await createSession(user.id, meta)
  const accessToken = await signAccessToken({
    sub: user.id,
    mobile: user.mobile,
    kycLevel: user.kycLevel,
    sid: session.id,
  })

  await writeAudit({
    actorType: 'user',
    actorId: user.id,
    action: 'USER_LOGIN',
    entityType: 'session',
    entityId: session.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return { user: toPublicUser(user), accessToken, refreshToken }
}

// ============================================
// OTP endpoints
// ============================================
export async function requestOtp(input: OtpSendInput) {
  // برای reset فقط اگر کاربر واقعاً وجود دارد ارسال می‌شود؛ پاسخ همیشه یکسان است
  if (input.purpose === 'reset') {
    const user = await prisma.user.findUnique({ where: { mobile: input.mobile } })
    if (user && user.status === 'ACTIVE') {
      await sendOtp(user.mobile, 'reset')
    }
    return { sent: true }
  }
  const result = await sendOtp(input.mobile, input.purpose)
  return { sent: true, ...result }
}

// ============================================
// Password Recovery
// ============================================
export async function requestPasswordReset(mobile: string) {
  const user = await prisma.user.findUnique({ where: { mobile } })
  // پاسخ همیشه یکسان — username enumeration ممنوع
  if (user && user.status === 'ACTIVE') {
    await sendOtp(user.mobile, 'reset')
  }
  return { sent: true }
}

export async function resetPassword(input: ResetPasswordInput, meta: SessionMeta) {
  await verifyOtp(input.mobile, 'reset', input.code)
  const user = await prisma.user.findUnique({ where: { mobile: input.mobile } })
  if (!user || user.status !== 'ACTIVE') {
    throw ApiError.badRequest('بازیابی رمز عبور برای این شماره امکان‌پذیر نیست')
  }

  const passwordHash = await hashPassword(input.password)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  // امنیت: همه Sessionها پس از تغییر رمز لغو می‌شوند
  await revokeAllUserSessions(user.id)
  await writeAudit({
    actorType: 'user',
    actorId: user.id,
    action: 'SECURITY_PASSWORD_RESET',
    entityType: 'user',
    entityId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { reset: true }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  meta: SessionMeta & { currentSessionId?: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.unauthorized()

  const valid = await verifyPassword(input.currentPassword, user.passwordHash)
  if (!valid) throw ApiError.badRequest('رمز عبور فعلی نادرست است')
  if (input.currentPassword === input.newPassword) {
    throw ApiError.badRequest('رمز جدید باید با رمز فعلی متفاوت باشد')
  }

  const passwordHash = await hashPassword(input.newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  // Sessionهای دیگر لغو می‌شوند؛ Session فعلی باقی می‌ماند
  await revokeAllOtherSessions(user.id, meta.currentSessionId)
  await writeAudit({
    actorType: 'user',
    actorId: user.id,
    action: 'SECURITY_PASSWORD_CHANGED',
    entityType: 'user',
    entityId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { changed: true }
}

// ============================================
// Session Management
// ============================================
export async function logout(sessionId: string, userId: string, meta: SessionMeta) {
  await revokeSession(sessionId)
  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'USER_LOGOUT',
    entityType: 'session',
    entityId: sessionId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { loggedOut: true }
}

export async function listSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      deviceInfo: true,
      createdAt: true,
      expiresAt: true,
    },
  })
  return sessions
}

// فقط Session متعلق به خود کاربر — user-to-user isolation
export async function revokeUserSession(userId: string, sessionId: string, meta: SessionMeta) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) {
    throw ApiError.notFound('نشست یافت نشد')
  }
  await revokeSession(sessionId)
  await writeAudit({
    actorType: 'user',
    actorId: userId,
    action: 'SECURITY_SESSION_REVOKED',
    entityType: 'session',
    entityId: sessionId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })
  return { revoked: true }
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.unauthorized()
  return toPublicUser(user)
}

// Aggregation object برای import یکجا در route handlers
export const authService = {
  register,
  verifyRegisterOtp,
  login,
  requestOtp,
  requestPasswordReset,
  resetPassword,
  changePassword,
  logout,
  listSessions,
  revokeUserSession,
  getProfile,
}
