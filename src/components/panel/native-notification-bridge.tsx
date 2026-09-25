// ============================================
// Zar30 - Native Notification Bridge
// ============================================
// فقط روی APK فعال است — اعلان‌های خوانده‌نشده را به tray می‌برد
//   - LocalNotifications: نمایش سیستمی وقتی اپ باز/در پس‌زمینه است
//   - PushNotifications: listener برای کلیک روی اعلان FCM (وقتی پیکربندی شود)
// آخرین زمان دیده‌شده در Preferences نگه‌داری می‌شود تا تکرار نشود
// ============================================

'use client'

import { useEffect } from 'react'
import { isNativeApp } from '@/lib/mobile/capacitor'
import { apiGetWithRefresh } from '@/lib/api/client'

const LAST_SEEN_KEY = 'zar30_notif_last_seen'
const POLL_MS = 60_000

interface NotifRow {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

async function getLastSeen(): Promise<number> {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: LAST_SEEN_KEY })
    return value ? Number(value) : Date.now() // اولین اجرا: فقط اعلان‌های جدید
  } catch {
    return Date.now()
  }
}

async function setLastSeen(ts: number) {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: LAST_SEEN_KEY, value: String(ts) })
  } catch {
    // ذخیره اختیاری است
  }
}

async function pollAndNotify() {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') return

  const res = await apiGetWithRefresh<{ notifications: NotifRow[] }>('/api/v1/users/notifications')
  if (!res.ok) return

  const lastSeen = await getLastSeen()
  const fresh = (res.data?.notifications ?? [])
    .filter((n) => !n.read && new Date(n.createdAt).getTime() > lastSeen)
    .slice(0, 5)

  if (fresh.length > 0) {
    await LocalNotifications.schedule({
      notifications: fresh.map((n, i) => ({
        id: i + 1 + (Math.floor(Date.now() / 1000) % 100000),
        title: n.title,
        body: n.body,
        smallIcon: 'ic_launcher',
      })),
    })
  }
  await setLastSeen(Date.now())
}

export function NativeNotificationBridge() {
  useEffect(() => {
    if (!isNativeApp()) return
    let cancelled = false

    void (async () => {
      // listener کلیک روی اعلان FCM (اگر پیکربندی شده باشد)
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const url = (action.notification.data?.url as string) ?? '/dashboard/notifications'
          window.location.href = url
        })
      } catch {
        // Push plugin بدون FCM — polling کافی است
      }
    })()

    const tick = async () => {
      if (cancelled) return
      await pollAndNotify().catch(() => {})
    }
    void tick()
    const t = setInterval(() => void tick(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return null
}
