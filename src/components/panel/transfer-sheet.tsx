// ============================================
// Zar30 - Transfer / Gift Sheet (Assets v2)
// ============================================
// شیت انتقال داخلی — طلا یا تومان به کاربر دیگر زرسی با موبایل
//   سوییچ «هدیه» → kind=GIFT + پیام + notification متفاوت برای گیرنده
//   OTP مالی + Idempotency-Key اجباری — journal متقارن سمت سرور
// ============================================

'use client'

import { useState } from 'react'
import { IconAlertTriangle, IconGift, IconTransfer } from '@tabler/icons-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { FinancialOtp } from './financial-otp'
import { cn } from 'cn'

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface TransferSheetProps {
  open: boolean
  onClose: () => void
  online: boolean
  onCompleted: () => void
  /** حالت صفحه مستقل — بدون قاب BottomSheet */
  inline?: boolean
}

export function TransferSheet({ open, onClose, online, onCompleted, inline }: TransferSheetProps) {
  const [assetType, setAssetType] = useState<'TOMAN' | 'GOLD'>('GOLD')
  const [mobile, setMobile] = useState('')
  const [amount, setAmount] = useState('')
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setAssetType('GOLD')
    setMobile('')
    setAmount('')
    setIsGift(false)
    setGiftMessage('')
    setOtpCode('')
    setError(null)
    setDone(false)
    setBusy(false)
  }

  async function submit() {
    setError(null)
    if (!/^09\d{9}$/.test(mobile)) {
      setError('شماره موبایل گیرنده باید ۱۱ رقم و با ۰۹ شروع شود')
      return
    }
    if (assetType === 'TOMAN') {
      if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
        setError('مبلغ تومانی معتبر وارد کنید')
        return
      }
    } else if (!/^\d+(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
      setError('مقدار طلا را به گرم وارد کنید (مثلاً 0.5)')
      return
    }
    if (!/^\d{4,8}$/.test(otpCode)) {
      setError('کد تایید پیامکی را وارد کنید')
      return
    }

    setBusy(true)
    const res = await apiPost(
      '/api/v1/transfers',
      {
        recipientMobile: mobile,
        assetType,
        ...(assetType === 'TOMAN' ? { tomanAmount: amount } : { goldAmount: amount }),
        kind: isGift ? 'GIFT' : 'TRANSFER',
        ...(isGift && giftMessage.trim() ? { giftMessage: giftMessage.trim() } : {}),
        otpCode,
      },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'انتقال ناموفق بود')
      return
    }
    setDone(true)
    onCompleted()
  }

  const content = done ? (
    <div className="space-y-4 py-4 text-center">
      <p className="text-success text-sm font-bold">
        {isGift ? 'هدیه شما ارسال شد' : 'انتقال با موفقیت انجام شد'}
      </p>
      <p className="text-muted-foreground text-xs leading-5">
        {isGift
          ? 'گیرنده از طریق اعلان درون‌برنامه‌ای مطلع می‌شود.'
          : 'مبلغ بلافاصله به کیف پول گیرنده منتقل شد.'}
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
      {/* نوع دارایی */}
      <div className="bg-muted/60 grid grid-cols-2 gap-1 rounded-xl p-1">
        {(
          [
            { key: 'GOLD', label: 'طلا (گرم)' },
            { key: 'TOMAN', label: 'تومان' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAssetType(key)
              setAmount('')
              setError(null)
            }}
            className={cn(
              'rounded-lg py-2 text-xs font-semibold transition-colors',
              assetType === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-muted-foreground text-[11px]">شماره موبایل گیرنده</span>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
          placeholder="09123456789"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-muted-foreground text-[11px]">
          {assetType === 'TOMAN' ? 'مبلغ (تومان)' : 'مقدار (گرم)'}
        </span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={assetType === 'TOMAN' && amount ? formatExactAmount(amount) : amount}
          onChange={(e) =>
            setAmount(
              assetType === 'TOMAN'
                ? e.target.value.replace(/[^\d]/g, '')
                : e.target.value.replace(/[^\d.]/g, ''),
            )
          }
          placeholder={assetType === 'TOMAN' ? '1,000,000' : '0.5'}
          className={inputClass}
        />
      </label>

      {/* سوییچ هدیه */}
      <button
        type="button"
        onClick={() => setIsGift((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border p-3 transition-colors',
          isGift ? 'border-gold-500 bg-gold-500/8' : 'border-border/60',
        )}
      >
        <span className="flex items-center gap-2">
          <IconGift
            className={cn('size-5', isGift ? 'text-gold-600' : 'text-muted-foreground')}
            stroke={1.75}
            aria-hidden="true"
          />
          <span className="text-foreground text-xs font-semibold">ارسال به‌صورت هدیه</span>
        </span>
        <span
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            isGift ? 'bg-gold-500' : 'bg-muted-foreground/30',
          )}
        >
          <span
            className={cn(
              'bg-card absolute top-0.5 size-4 rounded-full shadow transition-transform',
              isGift ? 'left-0.5' : 'left-4.5',
            )}
          />
        </span>
      </button>

      {isGift && (
        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-[11px]">پیام هدیه (اختیاری)</span>
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
            placeholder="تبریک تولد! این طلا از طرف من…"
            rows={2}
            className={cn(inputClass, 'h-auto py-2 leading-6')}
          />
        </label>
      )}

      {/* OTP مالی */}
      <div className="border-border/50 space-y-2 border-t pt-3">
        <p className="text-muted-foreground text-[11px]">تایید امنیتی</p>
        <FinancialOtp value={otpCode} onChange={setOtpCode} disabled={!online} />
      </div>

      {error && (
        <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      <Button
        className="w-full"
        onClick={submit}
        disabled={busy || !online}
        title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
      >
        {!online ? (
          'آفلاین'
        ) : busy ? (
          'در حال انتقال…'
        ) : (
          <>
            <IconTransfer className="size-4" aria-hidden="true" />
            {isGift ? 'ارسال هدیه' : 'انتقال'}
          </>
        )}
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
      title={isGift ? 'هدیه طلا / تومان' : 'انتقال به کاربر زرسی'}
    >
      {content}
    </BottomSheet>
  )
}
