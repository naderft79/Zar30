// ============================================
// Zar30 - Installment Checkout — صورتحساب پیش‌نمایش خرید قسطی
// Phase preview — ثبت نهایی قرارداد هنوز Backend ندارد
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { IconReceipt, IconScale, IconShieldCheck } from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from 'cn'

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
}

// همان قرارداد محاسبه‌گر — سقف اعتبار هر طرح
const TERM_CAPS: Record<number, number> = {
  3: 100_000_000,
  6: 200_000_000,
  12: 400_000_000,
  18: 500_000_000,
}
const MIN_AMOUNT = 10_000_000
const ANNUAL_RATE = 0.23

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (n: number) => formatExactAmount(String(Math.round(n)))

export function InstallmentCheckoutClient() {
  const searchParams = useSearchParams()
  const [price, setPrice] = useState<PriceData | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // اعتبارسنجی پارامترهای ورودی — مقادیر نامعتبر به بازه امن clamp می‌شوند
  const rawMonths = Number(searchParams.get('months'))
  const months = rawMonths in TERM_CAPS ? rawMonths : 6
  const rawAmount = Number(searchParams.get('amount'))
  const amount = Number.isFinite(rawAmount)
    ? Math.min(Math.max(rawAmount, MIN_AMOUNT), TERM_CAPS[months]!)
    : MIN_AMOUNT

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

  const goldGrams = price && price.buyPrice > 0 ? amount / price.buyPrice : null
  const monthlyRate = ANNUAL_RATE / 12
  const factor = Math.pow(1 + monthlyRate, months)
  const installment = (amount * monthlyRate * factor) / (factor - 1)
  const total = installment * months

  const rows: Array<{ label: string; value: string; hint?: string }> = [
    { label: 'اعتبار دریافتی', value: `${fmt(amount)} تومان` },
    { label: 'مبلغ هر قسط', value: `${fmt(installment)} تومان` },
    { label: 'زمان‌بندی اقساط', value: `${faDigits(String(months))} قسط ماهانه` },
    { label: 'مجموع قسط‌ها', value: `${fmt(total)} تومان`, hint: 'سود ۲۳٪ سالانه' },
  ]

  return (
    <div className="animate-stagger mx-auto max-w-xl space-y-5">
      {/* طلای دریافتی */}
      <Card className="border-gold-500/30 from-gold-500/15 via-gold-500/5 bg-gradient-to-bl to-transparent">
        <CardContent className="py-6 text-center">
          <span className="from-gold-500/25 to-gold-600/10 ring-gold-500/40 mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-bl ring-1">
            <IconScale className="text-gold-600 size-7" stroke={1.5} />
          </span>
          <p className="text-muted-foreground mt-3 text-xs">طلای دریافتی در خرید قسطی</p>
          {goldGrams === null ? (
            <p className="text-muted-foreground mt-1.5 text-3xl font-bold">—</p>
          ) : (
            <p className="text-foreground mt-1.5 text-3xl font-bold tabular-nums">
              {faDigits(goldGrams.toFixed(2))}
              <span className="text-gold-600 ms-1.5 text-base font-bold">گرم</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* صورتحساب */}
      <Card>
        <CardContent className="py-2">
          <p className="text-muted-foreground flex items-center gap-1.5 py-3 text-xs font-medium">
            <IconReceipt className="text-gold-600 size-4" stroke={1.75} />
            صورتحساب خرید اقساطی
          </p>
          <dl className="divide-border/60 divide-y">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground text-sm">{r.label}</dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {r.value}
                  {r.hint && (
                    <span className="text-muted-foreground/70 ms-1.5 text-[10px] font-normal">
                      ({r.hint})
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* شرط وثیقه */}
      <div className="border-navy-700/20 bg-navy-700/5 flex items-start gap-3 rounded-2xl border px-4 py-3.5">
        <IconShieldCheck className="text-navy-700 mt-0.5 size-5 shrink-0" stroke={1.75} />
        <p className="text-foreground/85 text-xs leading-relaxed">
          طلای خریداری‌شده تا پایان پرداخت اقساط نزد زرسی وثیقه می‌ماند.
        </p>
      </div>

      {/* موافقت با قوانین */}
      <label className="flex cursor-pointer items-start gap-2.5 px-1 select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="accent-navy-700 mt-0.5 size-4.5 shrink-0 cursor-pointer"
        />
        <span className="text-foreground/85 text-xs leading-relaxed">
          قوانین و مقررات خرید اقساطی از زرسی را مطالعه کرده‌ام و می‌پذیرم.
        </span>
      </label>

      {/* تایید و ادامه */}
      <button
        type="button"
        disabled={!agreed}
        onClick={() => setNotice('ثبت قرارداد اقساطی به‌زودی فعال می‌شود.')}
        className={cn(
          'focus-visible:ring-ring flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
          agreed
            ? 'bg-navy-700 text-cream-50 hover:bg-navy-600'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        تایید و ادامه
      </button>
      {notice && (
        <p role="status" className="text-muted-foreground text-center text-xs">
          {notice}
        </p>
      )}
    </div>
  )
}
