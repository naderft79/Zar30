// ============================================
// Zarnama - OTP Verification Form
// ============================================
// Client Component — اتصال به /api/v1/auth/otp/verify + resend
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

export function OtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mobile = searchParams.get('mobile') ?? ''
  const purpose = searchParams.get('purpose') ?? 'register'

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [done, setDone] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // شمارش معکوس ارسال مجدد
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  if (!mobile) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        شماره موبایل مشخص نیست —{' '}
        <Link href="/register" className="text-gold">
          دوباره ثبت‌نام کنید
        </Link>
      </p>
    )
  }

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < 5) inputsRef.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    setDigits(text.split('').concat(Array(6 - text.length).fill('')))
    inputsRef.current[Math.min(text.length, 5)]?.focus()
  }

  const code = digits.join('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setError(null)
    setLoading(true)
    const result = await apiPost('/api/v1/auth/otp/verify', { mobile, purpose, code })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'کد نادرست است')
      return
    }
    if (purpose === 'reset') {
      // برای reset صفحه reset-password خودش OTP را verify می‌کند
      router.push(`/reset-password?mobile=${encodeURIComponent(mobile)}&code=${code}`)
      return
    }
    setDone(true)
  }

  async function resend() {
    setError(null)
    const result = await apiPost('/api/v1/auth/otp/send', { mobile, purpose })
    if (!result.ok) {
      setError(result.error ?? 'ارسال مجدد ناموفق بود')
      return
    }
    setCooldown(60)
    setDigits(Array(6).fill(''))
    inputsRef.current[0]?.focus()
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-foreground text-sm">شماره موبایل شما با موفقیت تایید شد.</p>
        <Button className="w-full" size="lg" asChild>
          <Link href="/login">ورود به حساب</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="flex justify-center gap-2" dir="ltr">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            aria-label={`رقم ${i + 1}`}
            className="border-input bg-input text-foreground focus:border-ring focus:ring-ring/50 size-11 rounded-lg border text-center text-lg font-bold outline-none focus:ring-2 sm:size-12"
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading || code.length !== 6}>
        {loading ? 'در حال بررسی…' : 'تایید'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        کد را دریافت نکردید؟{' '}
        {cooldown > 0 ? (
          <span>ارسال مجدد تا {cooldown} ثانیه دیگر</span>
        ) : (
          <button type="button" onClick={resend} className="text-gold font-medium hover:underline">
            ارسال مجدد
          </button>
        )}
      </p>
    </form>
  )
}
