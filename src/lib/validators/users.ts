// ============================================
// Zar30 - User Profile Validators (Phase 3)
// ============================================

import { z } from 'zod'

// به‌روزرسانی profile — همه فیلدها اختیاری؛ mobile/kyc/status از این مسیر تغییر نمی‌کنند
export const profileUpdateSchema = z.object({
  firstName: z.string().trim().max(64, 'نام حداکثر ۶۴ کاراکتر').nullish(),
  lastName: z.string().trim().max(64, 'نام خانوادگی حداکثر ۶۴ کاراکتر').nullish(),
  email: z
    .string()
    .trim()
    .email('ایمیل نامعتبر است')
    .max(254)
    .nullish()
    .or(z.literal('').transform(() => null)),
  avatarUrl: z.string().trim().max(512).nullish(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
