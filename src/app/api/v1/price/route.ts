// ============================================
// Zar30 - Price API (Display)
// ============================================
// GET /api/v1/price — آخرین قیمت ثبت‌شده طلا برای نمایش
//
// منبع: جدول GoldPrice (همان مبنای معامله) — عدد ساختگی
// در production برنمی‌گردد. isLive فقط وقتی true است که
// قیمت تازه باشد؛ در غیر این صورت UI آن را نمایشی نشان می‌دهد.
// Provider خارجی در Phase 5 متصل می شود.
// ============================================

import { NextResponse } from 'next/server'
import { priceService } from '@/lib/price/price-service'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const price = await priceService.getCurrentPrice()
  return NextResponse.json({
    success: true,
    data: price,
    meta: { demo: !price.isLive },
  })
})
