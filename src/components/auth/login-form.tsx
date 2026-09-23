// ============================================
// Zar30 - Login Form
// ============================================
// Client Component — اتصال به /api/v1/auth/login
// ============================================

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginResponse {
  user: { id: string; mobile: string }
  accessToken: string
}

const inputCls =
  'h-12 rounded-xl border-border/60 bg-muted/40 px-4 text-[15px] transition-colors focus-visible:bg-card'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await apiPost<LoginResponse>('/api/v1/auth/login', { mobile, password })
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'ورود ناموفق بود')
      return
    }
    router.push(callbackUrl.startsWith('/') ? callbackUrl : '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-mobile" className="text-foreground mb-2 block text-sm font-semibold">
          شماره موبایل
        </label>
        <Input
          id="login-mobile"
          type="tel"
          required
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          dir="ltr"
          className={`${inputCls} text-left tracking-wide`}
          autoComplete="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="login-password" className="text-foreground block text-sm font-semibold">
            رمز عبور
          </label>
          <Link href="/forgot-password" className="text-gold-600 text-xs hover:underline">
            فراموشی رمز؟
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            dir="ltr"
            className={`${inputCls} pr-11 text-left`}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* چشم نمایش/مخفی رمز */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
            aria-pressed={showPassword}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {showPassword ? (
              <EyeOff className="size-4.5" strokeWidth={1.75} />
            ) : (
              <Eye className="size-4.5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm font-medium"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="bg-navy-700 hover:bg-navy-800 text-cream-50 h-12 w-full rounded-xl text-[15px] font-bold shadow-md"
      >
        {loading ? 'در حال ورود…' : 'ورود به حساب'}
      </Button>
    </form>
  )
}
