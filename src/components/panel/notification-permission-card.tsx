// ============================================
// Zar30 - Notification Permission Card
// ============================================
// درخواست دسترسی اعلان — Native (APK) و Web/PWA
// وضعیت denied → هدایت به تنظیمات سیستم/مرورگر
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconBellRinging, IconBellOff, IconBellCheck } from '@tabler/icons-react'
import {
  enableNotifications,
  getNotificationStatus,
  type NotificationStatus,
} from '@/lib/mobile/notifications'
import { cn } from 'cn'

export function NotificationPermissionCard() {
  const [status, setStatus] = useState<NotificationStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setStatus(await getNotificationStatus())
    })()
  }, [])

  async function enable() {
    setBusy(true)
    const res = await enableNotifications()
    setBusy(false)
    setStatus(res.status)
    setMessage(res.message)
  }

  // unsupported یا granted بدون پیام → کارت نشان داده نمی‌شود مگر برای اطلاع
  if (status === null) return null
  if (status === 'unsupported') return null

  const granted = status === 'granted'

  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-3 rounded-xl border p-3',
        granted
          ? 'border-success/30 bg-success/5'
          : status === 'denied'
            ? 'border-warning/40 bg-warning/5'
            : 'border-gold-500/30 bg-gold-500/5',
      )}
      role={granted ? 'status' : undefined}
    >
      {granted ? (
        <IconBellCheck
          className="text-success size-5 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ) : status === 'denied' ? (
        <IconBellOff
          className="text-warning size-5 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ) : (
        <IconBellRinging
          className="text-gold-600 dark:text-gold-400 size-5 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-foreground text-xs font-bold">
          {granted
            ? 'اعلان‌ها فعال است'
            : status === 'denied'
              ? 'اعلان‌ها خاموش است'
              : 'اعلان‌های لحظه‌ای را فعال کنید'}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[10px] leading-4">
          {granted
            ? (message ?? 'تغییرات قیمت، سفارش‌ها و وضعیت حساب برایتان ارسال می‌شود')
            : status === 'denied'
              ? (message ?? 'از تنظیمات مرورگر یا گوشی، دسترسی اعلان را فعال کنید')
              : 'بدون خروج از اپ، از خرید، فروش، برداشت و تایید احراز هویت باخبر شوید'}
        </p>
      </div>

      {status === 'default' && (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:ring-ring shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          {busy ? '…' : 'فعال‌سازی'}
        </button>
      )}
    </div>
  )
}
