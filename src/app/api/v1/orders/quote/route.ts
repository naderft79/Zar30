// ============================================
// Zar30 - /api/v1/orders/quote
// ============================================
// GET — پیش‌نمایش read-only معامله قبل از ثبت
// قیمت/کارمزد/تبدیل/سقف روزانه/موجودی در یک پاسخ
// هیچ اثر مالی ندارد — فقط خواندن
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { toJsonSafe } from '@/lib/finance/money'
import { getTradeQuote, type QuoteInputType, type QuoteSide } from '@/lib/finance/quote.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('trading.quote', auth.userId)

  const params = new URL(req.url).searchParams
  const side = params.get('side')
  const inputType = params.get('inputType')
  const amount = params.get('amount')

  if (side !== 'BUY' && side !== 'SELL') {
    throw ApiError.badRequest('side باید BUY یا SELL باشد')
  }
  if (inputType !== 'TOMAN' && inputType !== 'GOLD') {
    throw ApiError.badRequest('inputType باید TOMAN یا GOLD باشد')
  }
  if (!amount || amount.trim() === '') {
    throw ApiError.badRequest('amount الزامی است')
  }

  const quote = await getTradeQuote(auth, {
    side: side as QuoteSide,
    inputType: inputType as QuoteInputType,
    amount: amount.trim(),
  })

  return ok(toJsonSafe(quote))
})
