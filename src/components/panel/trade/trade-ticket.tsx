// ============================================
// Zar30 - Trade Terminal — Order Ticket (Exchange Style)
// ============================================
// تیکت سفارش به سبک صرافی‌های ارز دیجیتال:
//   - سرفلیپ خرید/فروش با لبه رنگی سبز/قرمز (بدون segmented pill)
//   - تب واحد ورودی تومان/گرم داخل تیکت
//   - پیش‌نمایش زنده quote + سقف روزانه + quick amounts + اسلایدر
//   - Confirmation Dialog قبل از POST
// ============================================

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowUpLeft,
  IconCircleCheck,
  IconLock,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiGet, apiPost } from '@/lib/api/client'
import {
  formatAmount,
  formatExactAmount,
  formatGoldAmount,
  toPersianDigits,
  toPersianWords,
} from '@/lib/utils/format'

// تبدیل ارقام فارسی/عربی ورودی کاربر به لاتین + جداسازی گروه‌بندی
function normalizeFaDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[,٬]/g, '')
}
import { useOnlineStatus } from '../offline-indicator'
import { cn } from 'cn'

type Side = 'BUY' | 'SELL'
type InputType = 'TOMAN' | 'GOLD'

interface Quote {
  side: Side
  inputType: InputType
  goldAmount: string
  tomanAmount: string
  unitPrice: string
  fee: string
  feeBps: number
  finalToman: string
  isLive: boolean
  minOrderToman: string
  dailyLimit: {
    kycLevel: string
    limitToman: string | null
    usedToday: string
    remainingToman: string | null
  }
  balances: {
    tomanAvailable: string
    goldAvailable: string
  }
}

interface OrderResult {
  order: {
    id: string
    type: Side
    goldAmount: string
    tomanAmount: string
    unitPrice: string
    fee: string
    total: string
    status: string
  }
}

const QUICK_TOMAN = [200_000, 500_000, 1_000_000, 2_000_000]
const SLIDER_STEPS = [0, 25, 50, 75, 100]

interface TradeTicketProps {
  onExecuted?: () => void
  className?: string
}

export function TradeTicket({ onExecuted, className }: TradeTicketProps) {
  const searchParams = useSearchParams()
  const [side, setSide] = useState<Side>(searchParams.get('side') === 'sell' ? 'SELL' : 'BUY')
  const [inputType, setInputType] = useState<InputType>('TOMAN')
  const [amount, setAmount] = useState('')
  const [sliderPct, setSliderPct] = useState<number | null>(null)

  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<OrderResult['order'] | null>(null)

  const online = useOnlineStatus()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quoteSeq = useRef(0)

  const available = useMemo(() => {
    if (!quote) return null
    return side === 'BUY' ? quote.balances.tomanAvailable : quote.balances.goldAvailable
  }, [quote, side])

  const fetchQuote = useCallback(async () => {
    if (amount === '' || Number(amount) <= 0) return
    const seq = ++quoteSeq.current
    setQuoteLoading(true)
    const res = await apiGet<Quote>(
      `/api/v1/orders/quote?side=${side}&inputType=${inputType}&amount=${encodeURIComponent(amount)}`,
    )
    if (seq !== quoteSeq.current) return
    setQuoteLoading(false)
    if (res.ok && res.data) {
      setQuote(res.data)
      setQuoteError(null)
    } else {
      setQuote(null)
      setQuoteError(res.error ?? 'پیش‌نمایش ناموفق بود')
    }
  }, [amount, side, inputType])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (amount === '' || Number(amount) <= 0) {
        setQuote(null)
        setQuoteError(null)
        setQuoteLoading(false)
        return
      }
      setQuoteLoading(true)
      void fetchQuote()
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchQuote, amount])

  function switchSide(next: Side) {
    setSide(next)
    setAmount('')
    setSliderPct(null)
    setError(null)
    setSuccess(null)
  }
  function switchInputType(next: InputType) {
    setInputType(next)
    setAmount('')
    setSliderPct(null)
  }

  function applySlider(pct: number) {
    if (!available) return
    setSliderPct(pct)
    if (pct === 0) {
      setAmount('')
      return
    }
    if (side === 'BUY') {
      setAmount(String(Math.floor((Number(available) * pct) / 100)))
    } else {
      const raw = (Number(available) * pct) / 100
      setAmount(raw.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''))
    }
  }

  const inputValid = /^\d+(\.\d{1,8})?$/.test(amount) && Number(amount) > 0
  const minOrder = Number(quote?.minOrderToman ?? 10_000)
  const belowMin =
    side === 'BUY' && inputType === 'TOMAN' && inputValid && Number(amount) < minOrder
  const insufficientBalance =
    quote != null && available != null && inputValid && Number(amount) > Number(available)
  const canSubmit =
    online && inputValid && !belowMin && !insufficientBalance && !quoteLoading && quote != null

  const limit = quote?.dailyLimit
  const limitPct =
    limit?.limitToman != null && Number(limit.limitToman) > 0
      ? Math.min(100, (Number(limit.usedToday) / Number(limit.limitToman)) * 100)
      : null

  async function execute() {
    if (!quote) return
    setBusy(true)
    setError(null)
    const body =
      side === 'BUY'
        ? { type: 'BUY', tomanAmount: quote.tomanAmount }
        : { type: 'SELL', goldAmount: quote.goldAmount }
    const res = await apiPost<OrderResult>('/api/v1/orders', body, {
      'Idempotency-Key': crypto.randomUUID(),
    })
    setBusy(false)
    if (!res.ok) {
      setConfirmOpen(false)
      setError(res.error ?? 'معامله ناموفق بود')
      return
    }
    setConfirmOpen(false)
    setSuccess(res.data!.order)
    setAmount('')
    setSliderPct(null)
    onExecuted?.()
    void fetchQuote()
  }

  const kycLabel =
    limit?.kycLevel === 'LEVEL_0'
      ? '۰'
      : limit?.kycLevel === 'LEVEL_1'
        ? '۱'
        : limit?.kycLevel === 'LEVEL_2'
          ? '۲'
          : '۳'

  return (
    <div className={cn('terminal-surface overflow-hidden rounded-xl', className)} dir="rtl">
      {/* سرفلیپ BUY/SELL — دو لبه رنگی به سبک exchange */}
      <div className="grid grid-cols-2">
        {(
          [
            { key: 'BUY' as const, label: 'خرید', Icon: IconArrowDownLeft },
            { key: 'SELL' as const, label: 'فروش', Icon: IconArrowUpLeft },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchSide(key)}
            aria-pressed={side === key}
            className={cn(
              'flex h-12 items-center justify-center gap-2 border-b-2 text-sm font-bold transition-all duration-(--duration-normal)',
              side === key && key === 'BUY' && 'border-success bg-success/10 text-success',
              side === key && key === 'SELL' && 'border-error bg-error/10 text-error',
              side !== key && 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            <Icon className="size-4" stroke={2} />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4">
        {/* موجودی قابل معامله */}
        <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-muted-foreground text-[10px]">موجودی قابل معامله</span>
          {available != null && Number(available) > 0 ? (
            <span className="text-foreground font-num text-xs font-bold tabular-nums" dir="ltr">
              {side === 'BUY'
                ? `${formatExactAmount(available)} تومان`
                : `${formatGoldAmount(available)} گرم`}
            </span>
          ) : (
            <span className="text-muted-foreground/70 text-[10px]">مقداری وارد کنید…</span>
          )}
        </div>

        {/* واحد ورودی — تب داخلی */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[10px]">واحد ورودی</span>
          <div className="bg-muted/60 inline-flex rounded-md p-0.5">
            {(
              [
                { key: 'TOMAN' as const, label: 'تومان' },
                { key: 'GOLD' as const, label: 'گرم' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchInputType(key)}
                aria-pressed={inputType === key}
                className={cn(
                  'rounded px-3 py-1 text-[10px] font-semibold transition-colors',
                  inputType === key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ورودی مبلغ — فیلد بزرگ با ارقام فارسی + گروه‌بندی هزارگان */}
        <div className="bg-muted/40 rounded-xl px-4 py-3">
          <label className="block">
            <span className="text-muted-foreground flex items-center justify-between text-[10px] font-medium">
              {inputType === 'TOMAN' ? 'مبلغ (تومان)' : 'مقدار (گرم)'}
              {amount !== '' && (
                <span className="text-muted-foreground/70 text-[9px]">
                  {toPersianWords(inputType === 'TOMAN' ? Number(amount) : Number(amount))}
                  {inputType === 'TOMAN' ? ' تومان' : ' گرم'}
                </span>
              )}
            </span>
            <div className="relative mt-1.5 flex items-center">
              <input
                type="text"
                inputMode="decimal"
                dir="rtl"
                value={
                  amount === ''
                    ? ''
                    : formatAmount(inputType === 'TOMAN' ? amount : amount, { digits: 'fa' })
                }
                onChange={(e) => {
                  const raw = normalizeFaDigits(e.target.value)
                  setAmount(
                    inputType === 'TOMAN' ? raw.replace(/[^\d]/g, '') : raw.replace(/[^\d.]/g, ''),
                  )
                  setSliderPct(null)
                }}
                placeholder={inputType === 'TOMAN' ? '۰' : '۰/۰۰۰'}
                className="text-foreground placeholder:text-muted-foreground/30 w-full bg-transparent text-2xl font-extrabold tabular-nums outline-none"
              />
              <span
                className={cn(
                  'pointer-events-none absolute end-0 text-sm font-bold select-none',
                  side === 'BUY' ? 'text-success/60' : 'text-error/60',
                )}
              >
                {inputType === 'TOMAN' ? 'تومان' : 'گرم'}
              </span>
            </div>
          </label>
          {/* میان‌بر +/− برای تنظیم سریع */}
        </div>

        {/* اسلایدر */}
        {available != null && Number(available) > 0 && (
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={sliderPct ?? 0}
              onChange={(e) => applySlider(Number(e.target.value))}
              aria-label="درصد از موجودی"
              className="accent-gold-500 h-1 w-full cursor-pointer"
            />
            <div className="flex justify-between">
              {SLIDER_STEPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applySlider(s)}
                  className={cn(
                    'text-[9px] font-medium transition-colors',
                    sliderPct === s
                      ? 'text-gold-600 dark:text-gold-400'
                      : 'text-muted-foreground/60 hover:text-foreground',
                  )}
                >
                  {toPersianDigits(s)}٪
                </button>
              ))}
            </div>
          </div>
        )}

        {/* پیش‌نمایش زنده */}
        {inputValid && (
          <div className="bg-muted/40 border-border rounded-lg border p-3" aria-live="polite">
            {!quote && quoteLoading && <div className="skeleton-shimmer h-16 rounded" />}
            {quoteError && (
              <p className="text-error flex items-center gap-1.5 text-[11px]">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {quoteError}
              </p>
            )}
            {quote && !quoteLoading && (
              <div className="space-y-1.5">
                <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                  <span>قیمت واحد</span>
                  <span className="text-foreground font-num font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(quote.unitPrice)}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                  <span>{side === 'BUY' ? 'طلا دریافتی' : 'طلا فروشی'}</span>
                  <span
                    className="text-foreground font-num text-xs font-bold tabular-nums"
                    dir="ltr"
                  >
                    {formatGoldAmount(quote.goldAmount)} گرم
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                  <span>کارمزد ({toPersianDigits((quote.feeBps / 100).toFixed(2))}٪)</span>
                  <span className="text-foreground font-num font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(quote.fee)}
                  </span>
                </div>
                <div className="border-border flex items-center justify-between border-t pt-1.5">
                  <span className="text-foreground text-[11px] font-bold">
                    {side === 'BUY' ? 'کل پرداختی' : 'خالص دریافتی'}
                  </span>
                  <span
                    className={cn(
                      'font-num text-sm font-extrabold tabular-nums',
                      side === 'BUY' ? 'text-foreground' : 'text-success',
                    )}
                    dir="ltr"
                  >
                    {formatExactAmount(quote.finalToman)} تومان
                  </span>
                </div>
                {!quote.isLive && (
                  <p className="text-[9px] text-amber-400">
                    قیمت تاخیری — معامله با آخرین قیمت معتبر سرور
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* سقف روزانه */}
        {limit && limit.limitToman === '0' && (
          <div className="bg-error/10 border-error/30 flex items-start gap-2 rounded-lg border p-2.5">
            <IconLock className="text-error mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p className="text-error text-[10px] leading-4">
              برای معامله، احراز هویت سطح ۱ لازم است —{' '}
              <a href="/dashboard/kyc" className="underline underline-offset-2">
                ارتقای سطح
              </a>
            </p>
          </div>
        )}
        {limit && limitPct != null && (
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center justify-between text-[9px]">
              <span>سقف روزانه (سطح {toPersianDigits(kycLabel)})</span>
              <span className="font-num tabular-nums" dir="ltr">
                {formatExactAmount(limit.usedToday)} / {formatExactAmount(limit.limitToman ?? '0')}
              </span>
            </div>
            <div className="bg-muted h-1 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  limitPct >= 100 ? 'bg-error' : limitPct >= 80 ? 'bg-amber-500' : 'bg-gold-500',
                )}
                style={{ width: `${Math.max(2, limitPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* خطاها */}
        {belowMin && (
          <p className="text-error flex items-center gap-1.5 text-xs" role="alert">
            <IconAlertTriangle className="size-3.5" aria-hidden="true" />
            حداقل خرید {formatExactAmount(String(minOrder))} تومان
          </p>
        )}
        {insufficientBalance && (
          <p className="text-error flex items-center gap-1.5 text-xs" role="alert">
            <IconAlertTriangle className="size-3.5" aria-hidden="true" />
            {side === 'BUY' ? 'موجودی تومانی کافی نیست' : 'موجودی طلای کافی نیست'}
          </p>
        )}
        {error && (
          <p className="text-error flex items-center gap-1.5 text-xs" role="alert">
            <IconAlertTriangle className="size-3.5" aria-hidden="true" />
            {error}
          </p>
        )}
        {success && (
          <div className="bg-success/10 border-success/30 rounded-lg border p-3" role="status">
            <p className="text-success flex items-center gap-1.5 text-xs font-semibold">
              <IconCircleCheck className="size-4" aria-hidden="true" />
              {success.type === 'BUY'
                ? `خرید شد — ${formatGoldAmount(success.goldAmount)} گرم`
                : `فروش شد — ${formatExactAmount(success.total)} تومان`}
            </p>
            <p className="text-muted-foreground mt-1 text-[10px] tabular-nums" dir="ltr">
              قیمت: {formatExactAmount(success.unitPrice)} · کارمزد:{' '}
              {formatExactAmount(success.fee)}
            </p>
          </div>
        )}

        {/* دکمه اجرا — رنگی به سبک exchange */}
        <Button
          onClick={() => {
            setSuccess(null)
            setConfirmOpen(true)
          }}
          disabled={!canSubmit}
          className={cn(
            'h-12 w-full text-sm font-extrabold',
            side === 'BUY'
              ? 'bg-success text-success-foreground hover:bg-success/90'
              : 'bg-error text-error-foreground hover:bg-error/90',
          )}
        >
          {!online
            ? 'آفلاین'
            : quoteLoading
              ? 'دریافت قیمت…'
              : side === 'BUY'
                ? 'خرید طلا'
                : 'فروش طلا'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {side === 'BUY' ? 'تایید خرید طلا' : 'تایید فروش طلا'}
            </DialogTitle>
            <DialogDescription>
              مشخصات را بررسی کنید — پس از تایید، معامله با همین قیمت اجرا می‌شود.
            </DialogDescription>
          </DialogHeader>
          {quote && (
            <div className="bg-muted/50 space-y-2 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">نوع معامله</span>
                <span className="text-foreground font-bold">
                  {side === 'BUY' ? 'خرید طلا' : 'فروش طلا'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">مقدار</span>
                <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                  {formatGoldAmount(quote.goldAmount)} گرم
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">قیمت واحد</span>
                <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                  {formatExactAmount(quote.unitPrice)} تومان/گرم
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">کارمزد</span>
                <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                  {formatExactAmount(quote.fee)} تومان
                </span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-t pt-2">
                <span className="text-foreground text-xs font-bold">
                  {side === 'BUY' ? 'کل پرداختی' : 'خالص دریافتی'}
                </span>
                <span
                  className={cn(
                    'text-sm font-extrabold tabular-nums',
                    side === 'BUY' ? 'text-foreground' : 'text-success',
                  )}
                  dir="ltr"
                >
                  {formatExactAmount(quote.finalToman)} تومان
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
              انصراف
            </Button>
            <Button
              onClick={execute}
              disabled={busy || !quote}
              className={cn(
                side === 'BUY'
                  ? 'bg-success text-success-foreground hover:bg-success/90'
                  : 'bg-error text-error-foreground hover:bg-error/90',
              )}
            >
              {busy ? 'در حال انجام…' : side === 'BUY' ? 'تایید خرید' : 'تایید فروش'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
