// ============================================
// Zar30 - Price History API (Display)
// ============================================
// GET /api/v1/price/history?range=daily|weekly|monthly — تاریخچه طلای ۱۸ عیار
//
// بازه‌ها (پنجره زمانی):
//   daily   → ۲۴ ساعت گذشته
//   weekly  → ۷ روز گذشته
//   monthly → ۳۰ روز گذشته
// منابع واقعی: رکوردهای intraday جدول GoldPrice + نرخ پایانی روزانه TGJU.
// خروجی حداکثر ۵۰ نقطه — اگر بیشتر بود، نمونه‌گیری یکنواخت در کل پنجره.
// هیچ داده ساختگی تولید نمی‌شود؛ در نبود داده لیست کوتاه برمی‌گردد.
// ============================================

import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ensureFreshPrice } from '@/lib/finance/pricing.service'
import { withErrorHandler } from '@/lib/api/response'

// پنجره‌های زمانی مجاز (به میلی‌ثانیه)
const RANGES: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
}

const TGJU_HISTORY_URL =
  'https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?length=45&start=0'

const MAX_POINTS = 50

interface Point {
  t: string
  buy: number
  sell: number
}

// نرخ پایانی روزانه واقعی از TGJU — ستون ۳ = نرخ پایانی (ریال/گرم)، ستون ۶ = تاریخ میلادی
async function tgjuDailyPoints(since: Date): Promise<Point[]> {
  try {
    const res = await fetch(TGJU_HISTORY_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: string[][] }
    const points: Point[] = []
    for (const row of json.data ?? []) {
      const closeRial = Number(row[3]?.replaceAll(',', ''))
      const [y, m, d] = (row[6] ?? '').split('/').map(Number)
      if (!Number.isFinite(closeRial) || closeRial <= 0 || !y || !m || !d) continue
      const t = new Date(y, m - 1, d, 12, 0, 0)
      if (Number.isNaN(t.getTime()) || t < since) continue
      // مرز واحد: ریال → تومان
      const close = Math.round(closeRial / 10)
      points.push({ t: t.toISOString(), buy: close, sell: close })
    }
    return points
  } catch {
    return []
  }
}

// رکوردهای intraday واقعی از DB (sync زنده providerها)
async function dbPoints(since: Date): Promise<Point[]> {
  const rows = await prisma.goldPrice.findMany({
    where: { recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
    take: 500,
    select: { buyPrice: true, sellPrice: true, recordedAt: true },
  })
  return rows.map((r) => ({
    t: r.recordedAt.toISOString(),
    buy: Number(r.buyPrice),
    sell: Number(r.sellPrice),
  }))
}

// نمونه‌گیری یکنواخت — حداکثر MAX_POINTS نقطه در کل پنجره (نقطه اول و آخر حفظ می‌شوند)
function sampleEvenly(points: Point[]): Point[] {
  if (points.length <= MAX_POINTS) return points
  const out: Point[] = []
  for (let i = 0; i < MAX_POINTS; i++) {
    out.push(points[Math.round((i * (points.length - 1)) / (MAX_POINTS - 1))]!)
  }
  return out
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const raw = req.nextUrl.searchParams.get('range') ?? 'daily'
  const range = raw in RANGES ? raw : 'daily'
  const since = new Date(Date.now() - RANGES[range]!)

  // یک تلاش بهینه برای تازه‌سازی قیمت — اگر provider در دسترس نبود،
  // همان داده‌های تاریخی برمی‌گردد و خطا نمی‌خوریم
  try {
    await ensureFreshPrice()
  } catch {
    // داده قدیمی‌تر هم برای نمودار کافی است
  }

  // ادغام دو منبع واقعی + مرتب‌سازی زمانی + حذف نقاط هم‌زمان تکراری
  const merged = [...(await dbPoints(since)), ...(await tgjuDailyPoints(since))].sort((a, b) =>
    a.t.localeCompare(b.t),
  )
  const deduped = merged.filter((p, i) => i === 0 || p.t !== merged[i - 1]!.t)

  return NextResponse.json({
    success: true,
    data: { range, points: sampleEvenly(deduped) },
  })
})
