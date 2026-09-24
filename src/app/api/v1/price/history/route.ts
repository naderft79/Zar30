// ============================================
// Zar30 - Price History API (Display)
// ============================================
// GET /api/v1/price/history?range=24h|7d|30d — تاریخچه قیمت طلای ۱۸ عیار
//
// منابع واقعی (بدون داده ساختگی):
//   - 24h → رکوردهای intraday جدول GoldPrice (sync زنده providerها)
//   - 7d/30d → نرخ پایانی روزانه TGJU (summary-table-data/geram18) + رکورد امروز
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

const TGJU_HISTORY_URL =
  'https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?length=40&start=0'

interface Point {
  t: string
  buy: number
  sell: number
}

// تاریخچه روزانه واقعی از TGJU — ستون ۳ = نرخ پایانی (ریال/گرم)، ستون ۶ = تاریخ میلادی
async function tgjuDailyPoints(): Promise<Point[]> {
  try {
    const res = await fetch(TGJU_HISTORY_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: string[][] }
    const rows = json.data ?? []
    const points: Point[] = []
    for (const row of rows) {
      const closeRial = Number(row[3]?.replaceAll(',', ''))
      const [y, m, d] = (row[6] ?? '').split('/').map(Number)
      if (!Number.isFinite(closeRial) || closeRial <= 0 || !y || !m || !d) continue
      const t = new Date(y, m - 1, d, 12, 0, 0)
      if (Number.isNaN(t.getTime())) continue
      // مرز واحد: ریال → تومان
      const close = Math.round(closeRial / 10)
      points.push({ t: t.toISOString(), buy: close, sell: close })
    }
    return points.reverse()
  } catch {
    return []
  }
}

// رکوردهای intraday واقعی از DB
async function dbPoints(since: Date): Promise<Point[]> {
  const rows = await prisma.goldPrice.findMany({
    where: { recordedAt: { gte: since } },
    orderBy: { recordedAt: 'desc' },
    take: 500,
    select: { buyPrice: true, sellPrice: true, recordedAt: true },
  })
  return rows.reverse().map((r) => ({
    t: r.recordedAt.toISOString(),
    buy: Number(r.buyPrice),
    sell: Number(r.sellPrice),
  }))
}

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

  const points =
    range === '24h'
      ? await dbPoints(since)
      : (await tgjuDailyPoints()).filter((p) => new Date(p.t) >= since)

  return NextResponse.json({
    success: true,
    data: { range, points },
  })
})
