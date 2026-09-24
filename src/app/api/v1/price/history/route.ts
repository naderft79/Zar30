// ============================================
// Zar30 - Price History API (Display)
// ============================================
// GET /api/v1/price/history?range=24h|7d|30d — تاریخچه قیمت ثبت‌شده
//
// منبع: جدول GoldPrice (همان رکوردهای واقعی sync قیمت) — هیچ داده ساختگی
// تولید نمی‌شود. اگر بازه داده کافی نداشته باشد، لیست کوتاه برمی‌گردد.
// ============================================

import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ensureFreshPrice } from '@/lib/finance/pricing.service'
import { withErrorHandler } from '@/lib/api/response'

// بازه‌های مجاز (به میلی‌ثانیه)
const RANGES: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

// سقف نقاط نمودار — جدیدترین‌ها نگه داشته می‌شوند
const MAX_POINTS = 500

export const GET = withErrorHandler(async (req: NextRequest) => {
  const raw = req.nextUrl.searchParams.get('range') ?? '24h'
  const range = raw in RANGES ? raw : '24h'
  const since = new Date(Date.now() - RANGES[range]!)

  // یک تلاش بهینه برای تازه‌سازی قیمت — اگر provider در دسترس نبود،
  // همان داده‌های تاریخی برمی‌گردد و خطا نمی‌خوریم
  try {
    await ensureFreshPrice()
  } catch {
    // داده قدیمی‌تر هم برای نمودار کافی است
  }

  const rows = await prisma.goldPrice.findMany({
    where: { recordedAt: { gte: since } },
    orderBy: { recordedAt: 'desc' },
    take: MAX_POINTS,
    select: { buyPrice: true, sellPrice: true, recordedAt: true },
  })

  return NextResponse.json({
    success: true,
    data: {
      range,
      points: rows.reverse().map((r) => ({
        t: r.recordedAt.toISOString(),
        buy: Number(r.buyPrice),
        sell: Number(r.sellPrice),
      })),
    },
  })
})
