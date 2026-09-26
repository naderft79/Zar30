// ============================================
// Zar30 - Installment Checkout — صورتحساب خرید قسطی
// ============================================
// ورودی: ?amount=X&months=Y از صفحه محاسبه‌گر (اسلایدر)
// طرح‌ها از API واقعی: GET /api/v1/installments/plans
// ثبت: POST /api/v1/installments/contracts (Idempotency-Key) → PENDING
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconHelpCircle,
  IconReceipt,
  IconShieldCheck,
} from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { INSTALLMENT_TERMS } from '@/lib/data/installment-terms'
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

interface PlanDto {
  id: string
  name: string
  months: number
  downPaymentPercent: string
  interestRate: string
  fee: string
  minAmount: string
  maxAmount: string
  serviceFeePer10M: string
}

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
}

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (v: string | number) => formatExactAmount(String(Math.round(Number(v))))

// quote محلی برای نمایش — منطق annuity همان سرور؛ ثبت نهایی از مسیر سرور
// با محاسبه دقیق انجام می‌شود
function localQuote(plan: PlanDto, principal: number) {
  const down = Math.round((principal * Number(plan.downPaymentPercent)) / 100)
  const financed = principal - down
  const monthlyRate = Number(plan.interestRate) / 100 / 12
  const factor = Math.pow(1 + monthlyRate, plan.months)
  const installment = Math.round((financed * monthlyRate * factor) / (factor - 1))
  // هزینه خدمات — مقیاس به هر ۱۰ میلیون تومان (مقادیر دقیق سمت سرور محاسبه می‌شوند)
  const serviceFee = Math.round((principal / 10_000_000) * Number(plan.serviceFeePer10M || 0))
  return { down, installment, total: installment * plan.months, serviceFee }
}

export function InstallmentCheckoutClient() {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanDto[]>([])
  const [price, setPrice] = useState<PriceData | null>(null)
  // مقدار اولیه از query params صفحه محاسبه‌گر — lazy initializer (بدون setState در effect)
  const [initialQuery] = useState(() => {
    if (typeof window === 'undefined') return null
    const sp = new URLSearchParams(window.location.search)
    return { amount: Number(sp.get('amount')) || 0, months: Number(sp.get('months')) || 0 }
  })
  const [months, setMonths] = useState<number | null>(() => initialQuery?.months || null)
  const [amount, setAmount] = useState(() => initialQuery?.amount ?? 0)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [plansRes, priceRes] = await Promise.all([
        apiGetWithRefresh<{ plans: PlanDto[] }>('/api/v1/installments/plans'),
        apiGetWithRefresh<PriceData>('/api/v1/price'),
      ])
      if (cancelled) return
      if (plansRes.ok && plansRes.data?.plans.length) {
        setPlans(plansRes.data.plans)
        setMonths((m) => m ?? plansRes.data!.plans[0]?.months ?? null)
      }
      if (priceRes.ok && priceRes.data) setPrice(priceRes.data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const plan = plans.find((p) => p.months === months) ?? null
  const quote = useMemo(
    () => (plan && amount > 0 ? localQuote(plan, amount) : null),
    [plan, amount],
  )

  const goldGrams = price && price.buyPrice > 0 && amount > 0 ? amount / price.buyPrice : null

  // سررسید هر قسط = امروز + ۳۰ روز × شماره قسط
  const schedule = useMemo(() => {
    if (!plan) return []
    return Array.from({ length: plan.months }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + 30 * (i + 1))
      const parts = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: '2-digit',
        year: 'numeric',
      }).formatToParts(d)
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
      return `${get('weekday')}، ${get('day')} / ${get('month')} / ${get('year')}`
    })
  }, [plan])

  const valid =
    !!plan &&
    amount >= Number(plan.minAmount) &&
    amount <= Number(plan.maxAmount) &&
    agreed &&
    !busy

  async function submit() {
    if (!plan || !valid) return
    setBusy(true)
    setError(null)
    const res = await apiPost<{ id: string; status: string }>(
      '/api/v1/installments/contracts',
      { planId: plan.id, principal: String(amount), method: 'INTERNAL_CREDIT' },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت درخواست ناموفق بود')
      return
    }
    // موفق — به صفحه قسطی با پیام موفقیت
    router.push('/dashboard/installments?submitted=1')
  }

  return (
    <div className="animate-stagger mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard/installments"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconArrowRight className="size-4" stroke={1.75} />
        بازگشت به خرید قسطی
      </Link>

      {/* طلای دریافتی */}
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
      {plan && quote ? (
        <Card>
          <CardContent className="py-2">
            <p className="text-muted-foreground flex items-center gap-1.5 py-3 text-xs font-medium">
              <IconReceipt className="text-gold-600 size-4" stroke={1.75} />
              صورتحساب خرید اقساطی
            </p>
            <dl className="divide-border/60 divide-y">
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground text-sm">اعتبار دریافتی</dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {fmt(amount)} تومان
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground text-sm">
                  پیش‌پرداخت ({faDigits(plan.downPaymentPercent)}٪)
                </dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {fmt(quote.down)} تومان
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground flex items-center gap-1 text-sm">
                  مبلغ هر قسط
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    aria-label="مشاهده تاریخ دقیق اقساط"
                    className="text-gold-600 hover:text-gold-500 focus-visible:ring-ring flex size-5 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <IconHelpCircle className="size-4" stroke={1.75} />
                  </button>
                </dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {fmt(quote.installment)} تومان · {faDigits(String(plan.months))} قسط
                </dd>
              </div>
              {quote.serviceFee > 0 && (
                <div className="flex items-center justify-between py-3">
                  <dt className="text-muted-foreground text-sm">هزینه خدمات (هر ۱۰ میلیون)</dt>
                  <dd className="text-foreground text-sm font-bold tabular-nums">
                    {fmt(quote.serviceFee)} تومان
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground text-sm">نرخ سود</dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {faDigits(plan.interestRate)}٪ سالانه
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground text-sm">مجموع بازپرداخت</dt>
                <dd className="text-foreground text-sm font-bold tabular-nums">
                  {fmt(quote.down + quote.total)} تومان
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : (
        <div className="skeleton-shimmer h-64 rounded-2xl" />
      )}

      {/* شرط وثیقه */}
      <div className="border-navy-700/20 bg-navy-700/5 flex items-start gap-3 rounded-2xl border px-4 py-3.5">
        <IconShieldCheck className="text-navy-700 mt-0.5 size-5 shrink-0" stroke={1.75} />
        <p className="text-foreground/85 text-xs leading-relaxed">
          طلای خریداری‌شده تا پایان پرداخت اقساط نزد زرسی وثیقه می‌ماند.
        </p>
      </div>

      {/* موافقت با قوانین */}
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

      {error && (
        <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* ثبت درخواست */}
      <button
        type="button"
        onClick={submit}
        disabled={!valid}
        className={cn(
          'focus-visible:ring-ring flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
          valid
            ? 'bg-navy-700 text-cream-50 hover:bg-navy-600'
            : 'bg-muted text-muted-foreground pointer-events-none cursor-not-allowed',
        )}
      >
        {busy ? 'در حال ثبت…' : 'ثبت درخواست خرید قسطی'}
      </button>

      {/* مودال زمان‌بندی اقساط */}
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

      {/* مودال قوانین و مقررات */}
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
