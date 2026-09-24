// ============================================
// Zar30 - Financial OTP Field (مشترک)
// ============================================
// فیلد «ارسال کد + ورود کد» برای عملیات مالی حساس
// (انتقال/هدیه، برداشت، تحویل فیزیکی) — endpoint: /api/v1/auth/otp/financial
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { IconShieldCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api/client'
import { cn } from 'cn'

interface FinancialOtpProps {
  value: string
  onChange: (code: string) => void
  /** به‌روزرسانی وضعیت ارسال برای parent */
  onSentChange?: (sent: boolean) => void
  disabled?: boolean
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

export function FinancialOtp({ value, onChange, onSentChange, disabled }: FinancialOtpProps) {
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  function startCooldown(seconds: number) {
    setCooldown(seconds)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) {
          clearInterval(timer.current)
          timer.current = null
        }
        return Math.max(0, c - 1)
      })
    }, 1000)
  }

  async function send() {
    setBusy(true)
    setError(null)
    const res = await apiPost<{ expiresInSeconds?: number; resendCooldownSeconds?: number }>(
      '/api/v1/auth/otp/financial',
      {},
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ارسال کد ناموفق بود')
      return
    }
    setSent(true)
    onSentChange?.(true)
    startCooldown(res.data?.resendCooldownSeconds ?? 60)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={send}
          disabled={busy || disabled || cooldown > 0}
          className="shrink-0"
        >
          <IconShieldCheck className="size-4" aria-hidden="true" />
          {busy
            ? 'در حال ارسال…'
            : cooldown > 0
              ? `ارسال مجدد (${cooldown})`
              : sent
                ? 'ارسال مجدد'
                : 'ارسال کد تایید'}
        </Button>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
          placeholder="کد پیامک‌شده"
          disabled={disabled}
          className={cn(inputClass, 'text-center tracking-[0.3em]')}
          aria-label="کد تایید پیامکی"
        />
      </div>
      {sent && !error && (
        <p className="text-muted-foreground text-[10px]">کد تایید به شماره موبایل شما پیامک شد</p>
      )}
      {error && (
        <p role="alert" className="text-error text-[11px]">
          {error}
        </p>
      )}
    </div>
  )
}
