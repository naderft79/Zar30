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
import os from 'node:os'

// 0.0.0.0/:: آدرس bind سرور است و در مرورگر کار نمی‌کند → با IPv4 شبکه جایگزین می‌شود
function lanIpv4(): string | undefined {
  return Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address
}

function isWildcardHost(hostname: string): boolean {
  return hostname === '0.0.0.0' || hostname === '::' || hostname === '::0'
}

// origin قابل‌برگشت: اولویت با origin ارسالی مرورگر (دقیقاً همان جایی که کاربر بوده)
// در غیر اینصورت Host header — hostهای wildcard با IP شبکه جایگزین می‌شوند
function resolveOrigin(req: Request, clientOrigin?: string): string {
  if (clientOrigin) {
    try {
      const u = new URL(clientOrigin)
      if ((u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password) {
        if (isWildcardHost(u.hostname)) {
          const lan = lanIpv4()
          if (lan) return `${u.protocol}//${lan}${u.port ? `:${u.port}` : ''}`
        }
        return u.origin
      }
    } catch {
      // fallthrough → host header
    }
  }

  const reqUrl = new URL(req.url)
  const proto = req.headers.get('x-forwarded-proto') ?? reqUrl.protocol.replace(':', '')
  let host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? reqUrl.host

  const hostname = host.replace(/^\[|\]$/g, '').split(':')[0] ?? ''
  if (isWildcardHost(hostname)) {
    const lan = lanIpv4()
    const port = reqUrl.port || '3000'
    host = lan ? `${lan}:${port}` : `localhost:${port}`
  }
  return `${proto}://${host}`
}

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

  const callbackUrl = `${resolveOrigin(req, parsed.data.origin)}/api/v1/installments/callback`

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
