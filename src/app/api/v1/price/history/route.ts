// ============================================
// Zar30 - Price History API (Display)
// ============================================
// GET /api/v1/price/history?range=daily|weekly|monthly — تاریخچه طلای ۱۸ عیار
//
// منبع واقعی: نرخ پایانی روزانه TGJU (summary-table-data/geram18)
//   - daily   → ۵۰ نرخ پایانی روز اخیر
//   - weekly  → ۵۰ هفته اخیر (هفته از شنبه، آخرین نرخ هر هفته)
//   - monthly → ۵۰ ماه اخیر (آخرین نرخ هر ماه شمسی)
// هیچ داده ساختگی تولید نمی‌شود؛ در نبود داده لیست خالی برمی‌گردد.
// ============================================

import { NextResponse, type NextRequest } from 'next/server'
import { gregorianToJalali } from '@/lib/utils/jalali'
import { withErrorHandler } from '@/lib/api/response'

const RANGES = new Set(['daily', 'weekly', 'monthly'])

// ~۱۶۰۰ روز کاری ≈ ۵۲+ ماه — برای ماهانه ۵۰ رکورد کافی است
const TGJU_HISTORY_URL =
  'https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?length=1600&start=0'

const POINTS_PER_RANGE = 50

interface Point {
  t: string
  buy: number
  sell: number
}

interface DailyRow {
  date: Date
  close: number
}

// تاریخچه روزانه واقعی از TGJU — ستون ۳ = نرخ پایانی (ریال/گرم)، ستون ۶ = تاریخ میلادی
// خروجی: صعودی (قدیم → جدید)
async function tgjuDailyRows(): Promise<DailyRow[]> {
  try {
    const res = await fetch(TGJU_HISTORY_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: string[][] }
    const rows: DailyRow[] = []
    for (const row of json.data ?? []) {
      const closeRial = Number(row[3]?.replaceAll(',', ''))
      const [y, m, d] = (row[6] ?? '').split('/').map(Number)
      if (!Number.isFinite(closeRial) || closeRial <= 0 || !y || !m || !d) continue
      const date = new Date(y, m - 1, d, 12, 0, 0)
      if (Number.isNaN(date.getTime())) continue
      // مرز واحد: ریال → تومان
      rows.push({ date, close: Math.round(closeRial / 10) })
    }
    return rows.reverse()
  } catch {
    return []
  }
}

// کلید هفته ایرانی (شروع شنبه) — getDay: Sun=0 … Sat=6 → فاصله تا شنبه
function weekKey(d: Date): number {
  const offset = (d.getDay() + 1) % 7
  const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset)
  return sat.getTime()
}

function monthKey(d: Date): string {
  const j = gregorianToJalali(d)
  return `${j.jy}-${j.jm}`
}

// تجمیع روزانه به هفتگی/ماهانه — آخرین نرخ هر بازه (close واقعی)
function aggregate(rows: DailyRow[], keyFn: (d: Date) => number | string): DailyRow[] {
  const last = new Map<number | string, DailyRow>()
  for (const row of rows) last.set(keyFn(row.date), row)
  return [...last.values()]
}

function toPoint(r: DailyRow): Point {
  return { t: r.date.toISOString(), buy: r.close, sell: r.close }
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const raw = req.nextUrl.searchParams.get('range') ?? 'daily'
  const range = RANGES.has(raw) ? raw : 'daily'

  const daily = await tgjuDailyRows()
  let rows: DailyRow[]
  if (range === 'weekly') rows = aggregate(daily, weekKey)
  else if (range === 'monthly') rows = aggregate(daily, monthKey)
  else rows = daily

  const points = rows.slice(-POINTS_PER_RANGE).map(toPoint)

  return NextResponse.json({
    success: true,
    data: { range, points },
  })
})
