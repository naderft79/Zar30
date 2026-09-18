// ============================================
// Zarnama - Login Form
// ============================================
// Client Component — اتصال به /api/v1/auth/login
// ============================================

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginResponse {
  user: { id: string; mobile: string }
  accessToken: string
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-mobile" className="text-foreground mb-1.5 block text-sm font-medium">
          شماره موبایل
        </label>
        <Input
          id="login-mobile"
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
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="login-password" className="text-foreground block text-sm font-medium">
            رمز عبور
          </label>
          <Link href="/forgot-password" className="text-gold text-xs hover:underline">
            فراموشی رمز؟
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          required
          placeholder="••••••••"
          dir="ltr"
          className="text-left"
          autoComplete="current-password"
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
        {loading ? 'در حال ورود…' : 'ورود'}
      </Button>
    </form>
  )
}
