// ============================================
// Zar30 - Register Form
// ============================================
// Client Component — اتصال به /api/v1/auth/register
// پس از موفقیت → /verify-otp
// ============================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm() {
  const router = useRouter()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }

    setLoading(true)
    const result = await apiPost('/api/v1/auth/register', {
      mobile,
      password,
      ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'ثبت‌نام ناموفق بود')
      return
    }
    router.push(`/verify-otp?mobile=${encodeURIComponent(mobile)}&purpose=register`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="register-mobile"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          شماره موبایل
        </label>
        <Input
          id="register-mobile"
          type="tel"
          required
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          dir="ltr"
          className="text-left"
          autoComplete="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="register-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          رمز عبور
        </label>
        <Input
          id="register-password"
          type="password"
          required
          minLength={8}
          placeholder="حداقل ۸ کاراکتر"
          dir="ltr"
          className="text-left"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="register-referral"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          کد دعوت <span className="text-muted-foreground text-xs">(اختیاری)</span>
        </label>
        <Input
          id="register-referral"
          type="text"
          placeholder="XXXXXXXX"
          dir="ltr"
          className="text-left uppercase"
          maxLength={8}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
        />
      </div>

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'در حال ثبت‌نام…' : 'ثبت‌نام'}
      </Button>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        با ثبت‌نام،{' '}
        <Link href="/terms" className="text-gold hover:underline">
          قوانین
        </Link>{' '}
        و{' '}
        <Link href="/privacy" className="text-gold hover:underline">
          حریم خصوصی
        </Link>{' '}
        زرسی را می‌پذیرید.
      </p>
    </form>
  )
}
