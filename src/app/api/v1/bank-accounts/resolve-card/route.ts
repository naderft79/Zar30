// ============================================
// Zar30 - GET /api/v1/bank-accounts/resolve-card?pan=
// ============================================
// تبدیل شماره کارت به شبا + تشخیص بانک — برای پرکردن خودکار فرم ثبت کارت
// اگر provider پاسخ ندهد iban=null برمی‌گردد و کلاینت ورود دستی نشان می‌دهد
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { detectBankByCard } from '@/lib/banks'
import { resolveIbanFromCard } from '@/lib/finance/card-iban.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const pan = new URL(req.url).searchParams.get('pan') ?? ''
  if (!/^\d{16}$/.test(pan)) {
    throw ApiError.badRequest('شماره کارت باید ۱۶ رقم باشد')
  }

  const bank = detectBankByCard(pan)
  const iban = await resolveIbanFromCard(pan)
  return ok({
    iban,
    bank: bank.name !== 'بانک' ? { name: bank.name, logo: bank.logo } : null,
  })
})
