// ============================================
// Zar30 - GET /api/v1/installments/callback
// ============================================
// نقطه برگشت درگاه پرداخت هزینه خدمات اقساطی — public (مرورگر از درگاه برمی‌گردد)
// preview: فقط redirect به صفحه قسطی با وضعیت — قرارداد/ledger هنوز Backend ندارد
// ============================================

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api/response'
import { logger } from '@/lib/logger/logger'

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url)
  const authority = url.searchParams.get('Authority') ?? url.searchParams.get('authority')
  const status = url.searchParams.get('Status') ?? url.searchParams.get('status')

  const redirectBase = `${url.origin}/dashboard/installments`

  logger.info({ authority, status }, 'installment payment callback received')

  if (!authority || !status) {
    return NextResponse.redirect(`${redirectBase}?payment=invalid`)
  }
  if (status === 'OK') {
    return NextResponse.redirect(`${redirectBase}?payment=success`)
  }
  return NextResponse.redirect(`${redirectBase}?payment=failed`)
})
