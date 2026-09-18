// ============================================
// Zarnama - Reset Password Form
// ============================================
// کد OTP + رمز جدید → /api/v1/auth/password/reset
// ============================================

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [mobile, setMobile] = useState(searchParams.get('mobile') ?? '')
  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }
    setLoading(true)
    const result = await apiPost('/api/v1/auth/password/reset', { mobile, code, password })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'بازیابی ناموفق بود')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-foreground text-sm">رمز عبور شما با موفقیت تغییر کرد.</p>
        <Button className="w-full" size="lg" asChild>
          <Link href="/login">ورود با رمز جدید</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="reset-mobile" className="text-foreground mb-1.5 block text-sm font-medium">
          شماره موبایل
        </label>
        <Input
          id="reset-mobile"
          type="tel"
          required
          dir="ltr"
          className="text-left"
          autoComplete="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="reset-code" className="text-foreground mb-1.5 block text-sm font-medium">
          کد تایید (۶ رقم)
        </label>
        <Input
          id="reset-code"
          type="text"
          inputMode="numeric"
          required
          maxLength={6}
          dir="ltr"
          className="text-center text-lg tracking-widest"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div>
        <label
          htmlFor="reset-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          رمز عبور جدید
        </label>
        <Input
          id="reset-password"
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

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'در حال تغییر رمز…' : 'تغییر رمز عبور'}
      </Button>
    </form>
  )
}
