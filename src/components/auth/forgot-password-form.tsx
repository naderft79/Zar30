// ============================================
// Zarnama - Forgot Password Form
// ============================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ForgotPasswordForm() {
  const router = useRouter()
  const [mobile, setMobile] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // پاسخ همیشه یکسان است — چه کاربر وجود داشته باشد چه نه
    await apiPost('/api/v1/auth/password/forgot', { mobile })
    setLoading(false)
    setMessage('اگر این شماره ثبت شده باشد، کد بازیابی برایتان ارسال شد.')
    // هدایت به صفحه reset پس از لحظاتی
    setTimeout(() => {
      router.push(`/reset-password?mobile=${encodeURIComponent(mobile)}`)
    }, 1500)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="forgot-mobile" className="text-foreground mb-1.5 block text-sm font-medium">
          شماره موبایل
        </label>
        <Input
          id="forgot-mobile"
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

      {message && (
        <p role="status" className="bg-gold/10 text-foreground rounded-md px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'در حال ارسال…' : 'ارسال کد بازیابی'}
      </Button>
    </form>
  )
}
