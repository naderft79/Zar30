// ============================================
// Zar30 - Installments Client — Preview (بدون Financial Logic)
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconCalendarClock, IconCreditCard, IconFileText } from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from 'cn'

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
}

// ---- تنظیمات طرح اقساطی (پیش‌نمایش — مقادیر نهایی از پنل ادمین می‌آیند) ----
// سقف اعتبار هر طرح متفاوت است
const TERM_OPTIONS = [
  { months: 3, max: 100_000_000 },
  { months: 6, max: 200_000_000 },
  { months: 12, max: 400_000_000 },
  { months: 18, max: 500_000_000 },
] as const
const MIN_AMOUNT = 10_000_000
const STEP = 1_000_000
// نرخ سود سالانه اقساط — مقدار نهایی از پنل ادمین می‌آید
const ANNUAL_RATE = 0.23

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (n: number) => formatExactAmount(String(Math.round(n)))

export function InstallmentsClient() {
  const [months, setMonths] = useState<number>(6)
  const [amount, setAmount] = useState(100_000_000)
  const maxAmount = TERM_OPTIONS.find((t) => t.months === months)?.max ?? 500_000_000
  const [price, setPrice] = useState<PriceData | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<PriceData>('/api/v1/price')
      if (!cancelled && res.ok && res.data) setPrice(res.data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // طلای دریافتی = اعتبار ÷ قیمت خرید لحظه‌ای — دو رقم اعشار
  const goldGrams = price && price.buyPrice > 0 ? amount / price.buyPrice : null

  // فرمول استاندارد قسط (annuity): PMT = P·r·(1+r)^n / ((1+r)^n − 1) — r = نرخ ماهانه
  const monthlyRate = ANNUAL_RATE / 12
  const factor = Math.pow(1 + monthlyRate, months)
  const installment = (amount * monthlyRate * factor) / (factor - 1)
  const total = installment * months

  const fillPct = ((amount - MIN_AMOUNT) / (maxAmount - MIN_AMOUNT)) * 100

  return (
    <div className="animate-stagger space-y-5">
      {/* محاسبه‌گر خرید قسطی */}
      <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconCreditCard className="text-gold-600 size-5" stroke={1.75} />
            طرح‌های اقساطی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* تب‌های مدت بازپرداخت */}
          <div
            role="tablist"
            aria-label="مدت بازپرداخت"
            className="bg-muted/70 grid grid-cols-4 gap-1 rounded-xl p-1"
          >
            {TERM_OPTIONS.map((t) => (
              <button
                key={t.months}
                role="tab"
                aria-selected={months === t.months}
                onClick={() => {
                  setMonths(t.months)
                  setAmount((a) => Math.min(a, t.max))
                }}
                className={cn(
                  'focus-visible:ring-ring rounded-lg py-2 text-sm font-medium transition-all duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none',
                  months === t.months
                    ? 'bg-navy-700 text-cream-50 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.months === 3
                  ? '۳ ماهه'
                  : t.months === 6
                    ? '۶ ماهه'
                    : t.months === 12
                      ? '۱۲ ماهه'
                      : '۱۸ ماهه'}
              </button>
            ))}
          </div>

          {/* مبلغ اعتبار */}
          <div className="text-center">
            <p className="text-muted-foreground text-xs">مبلغ اعتبار خرید</p>
            <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
              {fmt(amount)}
              <span className="text-gold-600 ms-1.5 text-sm font-bold">تومان</span>
            </p>
          </div>

          {/* اسلایدر مبلغ */}
          <div dir="ltr">
            <input
              type="range"
              min={MIN_AMOUNT}
              max={maxAmount}
              step={STEP}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="مبلغ اعتبار خرید قسطی"
              aria-valuetext={`${fmt(amount)} تومان`}
              className="installment-slider w-full"
              style={{
                background: `linear-gradient(to right, var(--gold-500) 0%, var(--gold-500) ${fillPct}%, var(--muted) ${fillPct}%, var(--muted) 100%)`,
              }}
            />
            <div className="text-muted-foreground mt-2 flex items-center justify-between text-[10px] tabular-nums">
              <span>{faDigits('10')} میلیون تومان</span>
              <span>{faDigits(String(maxAmount / 1_000_000))} میلیون تومان</span>
            </div>
          </div>

          {/* طلای دریافتی */}
          <div className="border-gold-500/30 from-gold-500/15 via-gold-500/5 rounded-2xl border bg-gradient-to-bl to-transparent px-4 py-3.5 text-center">
            <p className="text-gold-700 text-[11px] font-medium">طلای دریافتی</p>
            {goldGrams === null ? (
              <p className="text-muted-foreground mt-1 text-lg font-bold">—</p>
            ) : (
              <p className="text-foreground mt-1 text-xl font-bold tabular-nums">
                {faDigits(goldGrams.toFixed(2))}
                <span className="text-gold-600 ms-1 text-xs font-medium">گرم</span>
              </p>
            )}
          </div>

          {/* جزئیات بازپرداخت */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-border/60 bg-muted/40 rounded-xl border px-3.5 py-3 text-center">
              <p className="text-muted-foreground text-[11px]">مبلغ هر قسط</p>
              <p className="text-foreground mt-1 text-base font-bold tabular-nums">
                {fmt(installment)}
              </p>
              <p className="text-muted-foreground/70 text-[10px]">
                تومان · {faDigits(String(months))} قسط
              </p>
            </div>
            <div className="border-border/60 bg-muted/40 rounded-xl border px-3.5 py-3 text-center">
              <p className="text-muted-foreground text-[11px]">مجموع اقساط</p>
              <p className="text-foreground mt-1 text-base font-bold tabular-nums">{fmt(total)}</p>
              <p className="text-muted-foreground/70 text-[10px]">تومان · سود ۲۳٪ سالانه</p>
            </div>
          </div>

          {/* دکمه خرید قسطی */}
          <button
            type="button"
            onClick={() => setNotice('ثبت سفارش اقساطی به‌زودی فعال می‌شود.')}
            className="bg-navy-700 text-cream-50 hover:bg-navy-600 focus-visible:ring-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <IconCreditCard className="size-5" stroke={1.75} />
            خرید قسطی
          </button>
          {notice && (
            <p role="status" className="text-muted-foreground text-center text-xs">
              {notice}
            </p>
          )}
        </CardContent>
      </Card>

      {/* قراردادها + اقساط پیش رو */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconFileText className="text-gold-600 size-5" stroke={1.75} />
              قراردادهای من
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={IconFileText}
              title="قراردادی ندارید"
              description="قراردادهای خرید اقساطی شما با وضعیت و جزئیات کامل اینجا نمایش داده می‌شوند."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconCalendarClock className="text-gold-600 size-5" stroke={1.75} />
              اقساط پیش رو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={IconCalendarClock}
              title="قسطی ندارید"
              description="سررسید اقساط، یادآوری‌ها و تاریخچه پرداخت اینجا مدیریت می‌شود."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
