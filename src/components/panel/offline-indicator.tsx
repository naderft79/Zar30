// ============================================
// Zar30 - Offline Indicator (PWA)
// ============================================
// بنر ظریف وضعیت اتصال — بالای صفحه، زیر header
// - offline: هشدار ملایم + عملیات مالی در UI غیرفعال می‌مانند (backend مرجع است)
// - reconnect: پیام سبز کوتاه + event رفرش داده
// ============================================

'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { IconWifiOff } from '@tabler/icons-react'
import { cn } from 'cn'

/** Eventی که صفحات برای رفرش داده به آن گوش می‌دهند (pull-to-refresh و reconnect) */
export const DATA_REFRESH_EVENT = 'zar30:data-refresh'

// وضعیت اتصال از طریق external store — بدون setState داخل effect
function subscribeOnline(cb: () => void) {
  window.addEventListener('offline', cb)
  window.addEventListener('online', cb)
  return () => {
    window.removeEventListener('offline', cb)
    window.removeEventListener('online', cb)
  }
}

/** هوک وضعیت اتصال — برای غیرفعال‌سازی اکشن‌های مالی در حالت آفلاین */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
}

export function OfflineIndicator() {
  const online = useOnlineStatus()
  // پیام «اتصال برقرار شد» فقط برای چند ثانیه نمایش داده می‌شود
  const [showReconnected, setShowReconnected] = useState(false)
  const wasOffline = useRef(false)

  // روی reconnect — event رفرش داده پخش می‌شود (داخل callback event، نه بدنه effect)
  useEffect(() => {
    const onOffline = () => {
      wasOffline.current = true
    }
    const onOnline = () => {
      if (!wasOffline.current) return
      wasOffline.current = false
      setShowReconnected(true)
      window.dispatchEvent(new Event(DATA_REFRESH_EVENT))
      setTimeout(() => setShowReconnected(false), 3_000)
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (online && !showReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'animate-fade-up sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-(--z-sticky) flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-medium backdrop-blur-md',
        online ? 'bg-success/90 text-white' : 'bg-navy-800/95 text-cream-100',
      )}
    >
      {online ? (
        'اتصال اینترنت برقرار شد'
      ) : (
        <>
          <IconWifiOff className="size-3.5" stroke={1.75} aria-hidden="true" />
          اتصال اینترنت برقرار نیست — عملیات مالی در دسترس نیستند
        </>
      )}
    </div>
  )
}
