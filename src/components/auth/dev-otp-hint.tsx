// ============================================
// Zarnama - Dev OTP Hint (فقط محیط تست)
// ============================================
// کد OTP را از dev endpoint می‌خواند و زیر باکس‌ها نشان می‌دهد
// فقط وقتی کار می‌کند که DEV_OTP_ENDPOINT=true و SMS_PROVIDER=mock باشد
// در production این endpoint همیشه 404 است و چیزی نمایش داده نمی‌شود
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { apiGet } from '@/lib/api/client'

interface DevOtpHintProps {
  mobile: string
  /** با هر تغییر، کد دوباره خوانده می‌شود (مثلاً پس از ارسال مجدد) */
  refreshKey?: number
}

export function DevOtpHint({ mobile, refreshKey = 0 }: DevOtpHintProps) {
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    if (!mobile) return
    let cancelled = false

    async function fetchCode() {
      const res = await apiGet<{ code: string | null }>(`/api/v1/dev/otp/${mobile}`)
      if (!cancelled) setCode(res.ok ? (res.data?.code ?? null) : null)
    }

    void fetchCode()
    // کد ممکن است چند لحظه بعد از render نوشته شود — چند بار تلاش کوتاه
    const interval = setInterval(fetchCode, 2000)
    const stop = setTimeout(() => clearInterval(interval), 12_000)
    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(stop)
    }
  }, [mobile, refreshKey])

  if (!code) return null

  return (
    <div className="border-gold/40 bg-gold/10 flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2">
      <FlaskConical className="text-gold size-4 shrink-0" />
      <p className="text-foreground text-sm">
        محیط تست — کد تایید:{' '}
        <span className="text-gold font-mono text-base font-bold tracking-[0.3em]" dir="ltr">
          {code}
        </span>
      </p>
    </div>
  )
}
