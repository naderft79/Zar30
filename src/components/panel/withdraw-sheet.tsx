// ============================================
// Zar30 - Withdraw Sheet (Assets v2)
// ============================================
// شیت برداشت — انتخاب از کارت‌های ذخیره‌شده یا شبای دستی + OTP مالی
// مبلغ بلافاصله سمت سرور قفل می‌شود (double-spend ممکن نیست)
// ============================================

'use client'

import { useState } from 'react'
import { IconAlertTriangle, IconCreditCard } from '@tabler/icons-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api/client'
import { detectBank, maskIban } from '@/lib/banks'
import { formatExactAmount } from '@/lib/utils/format'
import { FinancialOtp } from './financial-otp'
import type { BankAccountRow } from './bank-cards'
import { cn } from 'cn'

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

interface WithdrawSheetProps {
  open: boolean
  onClose: () => void
  online: boolean
  accounts: BankAccountRow[]
  onCompleted: () => void
  /** حالت صفحه مستقل — بدون قاب BottomSheet */
  inline?: boolean
}

export function WithdrawSheet({
  open,
  onClose,
  online,
  accounts,
  onCompleted,
  inline,
}: WithdrawSheetProps) {
  const [amount, setAmount] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [manualIban, setManualIban] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const useManual = selectedCardId === null

  function reset() {
    setAmount('')
    setSelectedCardId(null)
    setManualIban('')
    setOtpCode('')
    setError(null)
    setDone(false)
    setBusy(false)
  }

  async function submit() {
    setError(null)
    if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
      setError('مبلغ معتبر وارد کنید')
      return
    }
    const normalized = manualIban.replace(/\s/g, '').toUpperCase()
    if (useManual && !/^IR\d{24}$/.test(normalized)) {
      setError('شماره شبا باید با IR شروع و ۲۶ کاراکتر باشد')
      return
    }
    if (!/^\d{4,8}$/.test(otpCode)) {
      setError('کد تایید پیامکی را وارد کنید')
      return
    }
    setBusy(true)
    const res = await apiPost(
      '/api/v1/wallet/withdraw',
      {
        amount,
        ...(useManual ? { iban: normalized } : { bankAccountId: selectedCardId }),
        otpCode,
      },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت برداشت ناموفق بود')
      return
    }
    setDone(true)
    onCompleted()
  }

  const content = done ? (
    <div className="space-y-4 py-4 text-center">
      <p className="text-success text-sm font-bold">درخواست برداشت ثبت شد</p>
      <p className="text-muted-foreground text-xs leading-5">
        مبلغ تا پرداخت مسدود می‌شود و پس از بررسی به شبای شما واریز می‌شود.
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

      {/* انتخاب مقصد — کارت ذخیره‌شده یا شبای دستی */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-[11px]">حساب مقصد</p>
        {accounts.map((a) => {
          const bank = detectBank(a.iban)
          const selected = selectedCardId === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedCardId(a.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border p-3 text-right transition-colors',
                selected
                  ? 'border-gold-500 bg-gold-500/8'
                  : 'border-border/60 hover:border-gold-500/40',
              )}
            >
              <span className="flex items-center gap-2.5">
                <IconCreditCard
                  className="size-6 shrink-0"
                  style={{ color: bank.from }}
                  stroke={1.75}
                  aria-hidden="true"
                />
                <span>
                  <span className="text-foreground block text-xs font-bold">
                    {a.alias || a.bankName}
                  </span>
                  <span className="text-muted-foreground block text-[10px] tabular-nums" dir="ltr">
                    {maskIban(a.iban)}
                  </span>
                </span>
              </span>
              {a.isDefault && <span className="text-gold-600 text-[10px] font-bold">پیش‌فرض</span>}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setSelectedCardId(null)}
          className={cn(
            'w-full rounded-xl border p-3 text-right text-xs font-semibold transition-colors',
            useManual
              ? 'border-gold-500 bg-gold-500/8 text-foreground'
              : 'border-border/60 text-muted-foreground hover:border-gold-500/40',
          )}
        >
          شبای دیگر…
        </button>
      </div>

      {useManual && (
        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-[11px]">شماره شبا</span>
          <input
            type="text"
            dir="ltr"
            value={manualIban}
            onChange={(e) => setManualIban(e.target.value.toUpperCase().replace(/[^\dA-Z]/g, ''))}
            placeholder="IR062960000000100324200001"
            maxLength={26}
            className={inputClass}
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
        {!online ? 'آفلاین' : busy ? 'در حال ثبت…' : 'ثبت درخواست برداشت'}
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
      title="درخواست برداشت"
    >
      {content}
    </BottomSheet>
  )
}
