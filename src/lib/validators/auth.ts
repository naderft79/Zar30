// ============================================
// Zar30 - Auth Validators (Phase 2)
// ============================================

import { z } from 'zod'
import { iranMobileSchema, otpCodeSchema, passwordSchema } from './common'

export const otpPurposeSchema = z.enum(['register', 'login', 'reset'])

export const registerSchema = z.object({
  mobile: iranMobileSchema,
  password: passwordSchema,
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z2-7]{8}$/, 'کد دعوت نامعتبر است')
    .optional(),
})

export const loginSchema = z.object({
  mobile: iranMobileSchema,
  password: z.string().min(1, 'رمز عبور الزامی است'),
})

export const otpSendSchema = z.object({
  mobile: iranMobileSchema,
  purpose: otpPurposeSchema,
})

export const otpVerifySchema = z.object({
  mobile: iranMobileSchema,
  purpose: otpPurposeSchema,
  code: otpCodeSchema,
})

export const forgotPasswordSchema = z.object({
  mobile: iranMobileSchema,
})

export const resetPasswordSchema = z.object({
  mobile: iranMobileSchema,
  code: otpCodeSchema,
  password: passwordSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'رمز عبور فعلی الزامی است'),
  newPassword: passwordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpSendInput = z.infer<typeof otpSendSchema>
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
