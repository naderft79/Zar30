// ============================================
// Zar30 - GET /api/v1/payments/callback
// ============================================
// نقطه برگشت درگاه پرداخت — public (مرورگر کاربر از درگاه برمی‌گردد)
// پارامترها: Authority + Status (زرین‌پال) — authority مالکیت را مشخص می‌کند
// نتیجه: redirect به صفحه دارایی‌ها با وضعیت پرداخت
// امنیت: هیچ مبلغی از query خوانده نمی‌شود؛ مبلغ از DB و verify درگاه
// ============================================

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api/response'
import { handleGatewayCallback } from '@/lib/payment/payment.service'
import { logger } from '@/lib/logger/logger'

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url)
  const authority = url.searchParams.get('Authority') ?? url.searchParams.get('authority')
  const status = url.searchParams.get('Status') ?? url.searchParams.get('status')

  const redirectBase = `${url.origin}/dashboard/assets`

  if (!authority || !status) {
    return NextResponse.redirect(`${redirectBase}?payment=invalid`)
  }

  try {
    const result = await handleGatewayCallback({ authority, status })
    if (result.status === 'PAID') {
      const qs = result.replayed ? 'replayed' : 'success'
      return NextResponse.redirect(`${redirectBase}?payment=${qs}&ref=${result.refId ?? ''}`)
    }
    const map: Record<string, string> = {
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      FAILED: 'failed',
    }
    return NextResponse.redirect(`${redirectBase}?payment=${map[result.status] ?? 'failed'}`)
  } catch (err) {
    logger.warn({ err, authority }, 'payment callback failed')
    return NextResponse.redirect(`${redirectBase}?payment=failed`)
  }
})
