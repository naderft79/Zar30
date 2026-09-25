// ============================================
// Zar30 - Deposit Sheet (Assets v2)
// ============================================
// شیت واریز — دو روش:
//   ۱) درگاه پرداخت آنلاین (ریدایرکت به درگاه)
//   ۲) واریز شناسه‌دار/کارت‌به‌کارت (ثبت کد پیگیری → تایید ادمین)
// مبالغ سریع: ۱/۵/۱۰/۵۰ میلیون تومان
// ============================================

'use client'

import { useState } from 'react'
import { IconAlertTriangle, IconBuildingBank, IconCreditCard } from '@tabler/icons-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

const QUICK_AMOUNTS = [1_000_000, 5_000_000, 10_000_000, 50_000_000]

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface DepositSheetProps {
  open: boolean
  onClose: () => void
  online: boolean
  onCompleted: () => void
  /** حالت صفحه مستقل — بدون قاب BottomSheet */
  inline?: boolean
}

export function DepositSheet({ open, onClose, online, onCompleted, inline }: DepositSheetProps) {
  const [method, setMethod] = useState<'gateway' | 'manual'>('gateway')
  const [amount, setAmount] = useState('')
  const [trackingRef, setTrackingRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualDone, setManualDone] = useState(false)

  function reset() {
    setAmount('')
    setTrackingRef('')
    setError(null)
    setManualDone(false)
    setBusy(false)
  }

  async function submitGateway() {
    setError(null)
    if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
      setError('مبلغ معتبر وارد کنید')
      return
    }
    setBusy(true)
    const res = await apiPost<{ payment?: { redirectUrl?: string } }>(
      '/api/v1/payments',
      { amount },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok || !res.data?.payment?.redirectUrl) {
      setError(res.ok ? 'درگاه پرداخت در دسترس نیست' : (res.error ?? 'عملیات ناموفق بود'))
      return
    }
    window.location.href = res.data.payment.redirectUrl
  }

  async function submitManual() {
    setError(null)
    if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
      setError('مبلغ معتبر وارد کنید')
      return
    }
    if (trackingRef.trim().length < 4) {
      setError('شماره پیگیری یا شناسه واریز را وارد کنید')
      return
    }
    setBusy(true)
    const res = await apiPost(
      '/api/v1/wallet/deposit/manual',
      { amount, trackingRef: trackingRef.trim() },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت واریز ناموفق بود')
      return
    }
    setManualDone(true)
    onCompleted()
  }

  const content = manualDone ? (
    <div className="space-y-4 py-4 text-center">
      <p className="text-success text-sm font-bold">درخواست واریز شما ثبت شد</p>
      <p className="text-muted-foreground text-xs leading-5">
        پس از بررسی و تایید واحد مالی، مبلغ به کیف پول شما اضافه می‌شود. وضعیت آن را در سوابق
        واریزها دنبال کنید.
      </p>
      <Button
        className="w-full"
        onClick={() => {
          reset()
          onClose()
        }}
      >
        بستن
      </Button>
    </div>
  ) : (
    <div className="space-y-4">
      {/* تب روش واریز */}
      <div className="bg-muted/60 grid grid-cols-2 gap-1 rounded-xl p-1">
        {(
          [
            { key: 'gateway', label: 'درگاه پرداخت', icon: IconCreditCard },
            { key: 'manual', label: 'کارت‌به‌کارت', icon: IconBuildingBank },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMethod(key)
              setError(null)
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors',
              method === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* مبلغ + مبالغ سریع */}
      <label className="block space-y-1.5">
        <span className="text-muted-foreground text-[11px]">مبلغ (تومان)</span>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={amount ? formatExactAmount(amount) : ''}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="1,000,000"
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className={cn(
              'border-border/60 rounded-lg border py-1.5 text-[11px] font-semibold tabular-nums transition-colors',
              amount === String(v)
                ? 'border-gold-500 bg-gold-500/10 text-gold-700'
                : 'text-muted-foreground hover:border-gold-500/40',
            )}
            dir="ltr"
          >
            {formatExactAmount(String(v))}
          </button>
        ))}
      </div>

      {method === 'manual' && (
        <>
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-[11px]">شماره پیگیری / شناسه واریز</span>
            <input
              type="text"
              dir="ltr"
              value={trackingRef}
              onChange={(e) => setTrackingRef(e.target.value.slice(0, 50))}
              placeholder="شماره پیگیری فیش یا ساتنا/پایا"
              className={inputClass}
            />
          </label>
          <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
            مبلغ را به حساب اعلام‌شده پلتفرم کارت‌به‌کارت کنید، سپس شماره پیگیری را اینجا ثبت کنید.
            پس از تایید واحد مالی، موجودی شما شارژ می‌شود.
          </p>
        </>
      )}

      {method === 'gateway' && (
        <p className="text-muted-foreground text-[11px] leading-5">
          پس از ثبت، به درگاه امن پرداخت هدایت می‌شوید؛ مبلغ بلافاصله پس از پرداخت موفق به کیف پول
          شما اضافه می‌شود.
        </p>
      )}

      {error && (
        <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      <Button
        className="w-full"
        onClick={method === 'gateway' ? submitGateway : submitManual}
        disabled={busy || !online}
        title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
      >
        {!online ? 'آفلاین' : busy ? 'در حال ثبت…' : method === 'gateway' ? 'پرداخت' : 'ثبت واریز'}
      </Button>
    </div>
  )

  if (inline) return content

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="واریز به کیف پول"
    >
      {content}
    </BottomSheet>
  )
}
