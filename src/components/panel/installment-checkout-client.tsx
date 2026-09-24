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
import { INSTALLMENT_TERMS } from '@/lib/data/installment-terms'
import { computeInstallmentQuote, getInstallmentPlan } from '@/lib/installments/plans'
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

const MIN_AMOUNT = 10_000_000

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (n: number) => formatExactAmount(String(Math.round(n)))

export function InstallmentCheckoutClient() {
  const searchParams = useSearchParams()
  const [price, setPrice] = useState<PriceData | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  // اعتبارسنجی پارامترهای ورودی — مقادیر نامعتبر به بازه امن clamp می‌شوند
  const rawMonths = Number(searchParams.get('months'))
  const plan = getInstallmentPlan(rawMonths)
  const months = plan ? plan.months : 6
  const rawAmount = Number(searchParams.get('amount'))
  const maxAmount = getInstallmentPlan(months)?.maxAmount ?? 500_000_000
  const amount = Number.isFinite(rawAmount)
    ? Math.min(Math.max(rawAmount, MIN_AMOUNT), maxAmount)
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
  // فرمول استاندارد قسط (annuity) — از plans.ts
  const quote = computeInstallmentQuote(amount, months)
  const installment = quote?.installment ?? 0
  const total = quote?.total ?? 0

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

      {/* طلای دریافتی — مقدار بالا، لیبل کوچک‌تر پایین */}
      <div className="py-2 text-center">
        {goldGrams === null ? (
          <p className="text-muted-foreground text-3xl font-extrabold">—</p>
        ) : (
          <p className="text-foreground text-3xl font-extrabold tabular-nums">
            {faDigits(goldGrams.toFixed(2))}
            <span className="text-gold-600 ms-1 text-sm font-bold">گرم</span>
          </p>
        )}
        <p className="text-muted-foreground mt-2.5 text-[11px]">طلای دریافتی در خرید قسطی</p>
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

      {/* موافقت با قوانین — متن لینک‌دار بازکننده مودال */}
      <div className="flex items-start gap-2.5 px-1">
        <input
          type="checkbox"
          id="installment-terms"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="accent-navy-700 mt-0.5 size-4.5 shrink-0 cursor-pointer"
        />
        <p className="text-foreground/85 text-xs leading-relaxed">
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-gold-600 hover:text-gold-500 focus-visible:ring-ring rounded-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            قوانین و مقررات خرید اقساطی از زرسی
          </button>{' '}
          را مطالعه کرده‌ام و می‌پذیرم.
        </p>
      </div>

      {/* تایید و ادامه → صورتحساب پرداخت */}
      <Link
        href={agreed ? `/dashboard/installments/payment?amount=${amount}&months=${months}` : '#'}
        aria-disabled={!agreed}
        onClick={(e) => {
          if (!agreed) e.preventDefault()
        }}
        className={cn(
          'focus-visible:ring-ring flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
          agreed
            ? 'bg-navy-700 text-cream-50 hover:bg-navy-600'
            : 'bg-muted text-muted-foreground pointer-events-none cursor-not-allowed',
        )}
      >
        تایید و ادامه
      </Link>

      {/* مودال زمان‌بندی اقساط — سررسید هر ۳۰ روز از امروز */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="w-[calc(100%-2.5rem)] max-w-sm">
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

      {/* مودال قوانین و مقررات — تمام‌قد با دکمه قبول ثابت در پایین */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="flex h-[85dvh] w-[calc(100%-2.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-border/60 shrink-0 border-b px-5 py-4">
            <DialogTitle className="text-base">قوانین و مقررات خرید اقساطی از زرسی</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {INSTALLMENT_TERMS.map((paragraph, i) => (
              <p key={i} className="text-foreground/80 text-justify text-xs leading-6">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="border-border/60 shrink-0 border-t p-4">
            <button
              type="button"
              onClick={() => {
                setAgreed(true)
                setTermsOpen(false)
              }}
              className="bg-navy-700 text-cream-50 hover:bg-navy-600 focus-visible:ring-ring flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              قبول قوانین و ادامه
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
