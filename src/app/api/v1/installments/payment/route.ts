// ============================================
// Zar30 - POST /api/v1/installments/payment
// ============================================
// ایجاد جلسه پرداخت «هزینه خدمات + کارمزدهای» خرید اقساطی
// - مبالغ فقط سمت سرور محاسبه می‌شوند — به مبلغ ارسالی کلاینت اعتماد نمی‌شود
// - درگاه: محیط تست ZarinPal (zarinpal-sandbox)
// - بدون نوشتن رکورد مالی — preview؛ قرارداد اقساطی هنوز Backend ندارد
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { installmentPaymentSchema } from '@/lib/validators/finance'
import { getPaymentGateway } from '@/lib/payment/gateway'
import { computeInstallmentQuote } from '@/lib/installments/plans'
import { logger } from '@/lib/logger/logger'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = installmentPaymentSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const amount = Number(parsed.data.amount)
  const quote = computeInstallmentQuote(amount, parsed.data.months)
  if (!quote) {
    throw ApiError.badRequest('مبلغ یا مدت طرح خارج از بازه مجاز است')
  }

  const origin = new URL(req.url).origin
  const callbackUrl = `${origin}/api/v1/installments/callback`

  const gateway = getPaymentGateway('zarinpal-sandbox')
  const gatewayReq = await gateway
    .requestPayment({
      amountToman: BigInt(quote.payable),
      description: `هزینه خدمات خرید اقساطی طلا — ${quote.months} ماهه`,
      callbackUrl,
    })
    .catch((err) => {
      logger.warn({ err }, 'installment payment gateway request failed')
      throw new ApiError(
        502,
        'Bad Gateway',
        'درگاه پرداخت در دسترس نیست',
        'https://zar30.com/errors/gateway',
      )
    })

  return ok({
    redirectUrl: gatewayReq.redirectUrl,
    authority: gatewayReq.authority,
    payable: quote.payable,
  })
})
