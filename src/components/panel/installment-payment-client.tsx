// ============================================
// Zar30 - Installment Payment — صورتحساب هزینه خدمات و کارمزدها
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IconArrowRight, IconCreditCardPay, IconReceipt } from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { computeInstallmentQuote } from '@/lib/installments/plans'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from 'cn'

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
}

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (n: number) => formatExactAmount(String(Math.round(n)))

export function InstallmentPaymentClient() {
  const searchParams = useSearchParams()
  const [price, setPrice] = useState<PriceData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const months = Number(searchParams.get('months'))
  const amount = Number(searchParams.get('amount'))
  // صورتحساب فقط از محاسبه سمت کلاینت برای نمایش — مبلغ نهایی سمت سرور بازمحاسبه می‌شود
  const quote = computeInstallmentQuote(amount, months)

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

  const goldGrams = price && price.buyPrice > 0 && quote ? amount / price.buyPrice : null

  async function pay() {
    if (!quote || busy) return
    setBusy(true)
    setError(null)
    const res = await apiPost<{ redirectUrl: string }>('/api/v1/installments/payment', {
      amount: String(quote.amount),
      months: quote.months,
    })
    if (res.ok && res.data?.redirectUrl) {
      window.location.assign(res.data.redirectUrl)
      return
    }
    setBusy(false)
    setError(res.error ?? 'اتصال به درگاه پرداخت ناموفق بود')
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-muted-foreground py-10 text-center text-sm">
          پارامترهای طرح نامعتبر است.
        </p>
        <Link
          href="/dashboard/installments"
          className="bg-navy-700 text-cream-50 flex h-11 items-center justify-center rounded-xl text-sm font-bold"
        >
          بازگشت به خرید قسطی
        </Link>
      </div>
    )
  }

  const rows: Array<{ label: string; value: string; hint?: string }> = [
    { label: 'کارمزد خرید', value: `${fmt(quote.buyFee)} تومان`, hint: '۰.۵٪' },
    { label: 'کارمزد درگاه پرداخت', value: `${fmt(quote.gatewayFee)} تومان`, hint: '۰.۰۰۲٪' },
    {
      label: 'طلای قسطی دریافتی',
      value: goldGrams === null ? '—' : `${faDigits(goldGrams.toFixed(2))} گرم`,
    },
  ]

  return (
    <div className="animate-stagger mx-auto max-w-xl space-y-5">
      {/* برگشت به صورتحساب */}
      <Link
        href={`/dashboard/installments/checkout?amount=${quote.amount}&months=${quote.months}`}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconArrowRight className="size-4" stroke={1.75} />
        بازگشت به صورتحساب
      </Link>

      {/* هزینه خدمات — سربرگ صورتحساب */}
      <div className="py-2 text-center">
        <p className="text-muted-foreground text-xs">هزینه خدمات</p>
        <p className="text-foreground mt-1.5 text-3xl font-extrabold tabular-nums">
          {fmt(quote.serviceFee)}
          <span className="text-gold-600 ms-1.5 text-sm font-bold">تومان</span>
        </p>
      </div>

      {/* کارمزدها + طلای دریافتی */}
      <Card>
        <CardContent className="py-2">
          <p className="text-muted-foreground flex items-center gap-1.5 py-3 text-xs font-medium">
            <IconReceipt className="text-gold-600 size-4" stroke={1.75} />
            جزئیات پرداخت
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
            {/* مبلغ قابل پرداخت */}
            <div className="flex items-center justify-between py-3">
              <dt className="text-foreground text-sm font-bold">مبلغ قابل پرداخت</dt>
              <dd className="text-gold-600 text-base font-extrabold tabular-nums">
                {fmt(quote.payable)} تومان
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* پرداخت از طریق درگاه */}
      <button
        type="button"
        disabled={busy}
        onClick={pay}
        className={cn(
          'focus-visible:ring-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
          busy
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-navy-700 text-cream-50 hover:bg-navy-600',
        )}
      >
        <IconCreditCardPay className="size-5" stroke={1.75} />
        {busy ? 'در حال اتصال به درگاه…' : `پرداخت ${fmt(quote.payable)} تومان`}
      </button>
      {error && (
        <p role="alert" className="text-error text-center text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
