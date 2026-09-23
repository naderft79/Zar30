// ============================================
// Zar30 - Installment Checkout — صورتحساب پیش‌نمایش خرید قسطی
// Phase preview — ثبت نهایی قرارداد هنوز Backend ندارد
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IconArrowRight, IconHelpCircle, IconReceipt, IconShieldCheck } from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [scheduleOpen, setScheduleOpen] = useState(false)

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

  // سررسید هر قسط = امروز + ۳۰ روز × شماره قسط — قانون پرداخت هر ۳۰ روز
  const schedule = Array.from({ length: months }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + 30 * (i + 1))
    const parts = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(d)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    // قالب: «جمعه، ۱ / ۰۸ / ۱۴۰۵»
    return `${get('weekday')}، ${get('day')} / ${get('month')} / ${get('year')}`
  })

  const rows: Array<{ label: string; value: string; hint?: string; schedule?: boolean }> = [
    { label: 'اعتبار دریافتی', value: `${fmt(amount)} تومان` },
    { label: 'مبلغ هر قسط', value: `${fmt(installment)} تومان` },
    {
      label: 'زمان‌بندی اقساط',
      value: `${faDigits(String(months))} قسط ماهانه`,
      schedule: true,
    },
    { label: 'مجموع قسط‌ها', value: `${fmt(total)} تومان`, hint: 'سود ۲۳٪ سالانه' },
  ]

  return (
    <div className="animate-stagger mx-auto max-w-xl space-y-5">
      {/* برگشت به محاسبه‌گر */}
      <Link
        href="/dashboard/installments"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconArrowRight className="size-4" stroke={1.75} />
        بازگشت به خرید قسطی
      </Link>

      {/* طلای دریافتی — دو خط ساده بدون کارت */}
      <div className="py-2 text-center">
        <p className="text-muted-foreground text-xs">طلای دریافتی</p>
        {goldGrams === null ? (
          <p className="text-muted-foreground mt-1 text-2xl font-bold">—</p>
        ) : (
          <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
            {faDigits(goldGrams.toFixed(2))}
            <span className="text-gold-600 ms-1 text-sm font-bold">گرم</span>
          </p>
        )}
      </div>

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
                <dt className="text-muted-foreground flex items-center gap-1 text-sm">
                  {r.label}
                  {r.schedule && (
                    <button
                      type="button"
                      onClick={() => setScheduleOpen(true)}
                      aria-label="مشاهده تاریخ دقیق اقساط"
                      className="text-gold-600 hover:text-gold-500 focus-visible:ring-ring flex size-5 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <IconHelpCircle className="size-4" stroke={1.75} />
                    </button>
                  )}
                </dt>
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

      {/* مودال زمان‌بندی اقساط — سررسید هر ۳۰ روز از امروز */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">زمان‌بندی اقساط</DialogTitle>
            <DialogDescription>هر قسط هر ۳۰ روز سررسید می‌شود.</DialogDescription>
          </DialogHeader>
          <ul className="divide-border/60 max-h-72 divide-y overflow-y-auto">
            {schedule.map((date, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground text-xs">قسط {faDigits(String(i + 1))}</span>
                <span className="text-foreground text-xs font-medium tabular-nums">{date}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
