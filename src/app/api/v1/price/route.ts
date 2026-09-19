// ============================================
// Zar30 - Price API (Demo/Preview)
// ============================================
// GET /api/v1/price — قیمت نمایشی طلا
//
// توجه: این endpoint فعلاً داده Demo برمی گرداند.
// Provider واقعی در Phase 5 متصل می شود.
// پاسخ همیشه isLive=false است تا UI آن را
// به‌عنوان داده واقعی بازار نمایش ندهد.
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
