// ============================================
// Zar30 - Notification Permission & Push Subscription (Client)
// ============================================
// دو مسیر:
//   Native (APK) → Capacitor PushNotifications + LocalNotifications
//   Web/PWA      → Notification.requestPermission + PushManager.subscribe (VAPID)
// خروجی یکسان: وضعیت دسترسی + ثبت اشتراک در سرور
// ============================================

import { isNativeApp } from './capacitor'

export type NotificationStatus =
  | 'unsupported' // مرورگر/دستگاه پشتیبانی نمی‌کند
  | 'default' // هنوز نپرسیده
  | 'granted' // فعال — اشتراک ثبت شده
  | 'denied' // کاربر رد کرده — فقط از تنظیمات سیستم برمی‌گردد

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// وضعیت فعلی دسترسی — بدون prompt
export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (typeof window === 'undefined') return 'unsupported'

  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display === 'granted') return 'granted'
      if (perm.display === 'denied') return 'denied'
      return 'default'
    } catch {
      return 'unsupported'
    }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  const p = Notification.permission
  return p === 'default' ? 'default' : p === 'granted' ? 'granted' : 'denied'
}

// درخواست دسترسی + ثبت اشتراک در سرور — پیام فارسی برمی‌گرداند
export async function enableNotifications(): Promise<{
  status: NotificationStatus
  message: string
}> {
  if (isNativeApp()) return enableNative()
  return enableWeb()
}

// ---------- Native (APK) ----------
async function enableNative(): Promise<{ status: NotificationStatus; message: string }> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') {
      return {
        status: 'denied',
        message: 'دسترسی اعلان داده نشد — می توانید از تنظیمات گوشی فعال کنید',
      }
    }
    // اعلان‌های محلی (اپ باز) + آماده‌سازی Push برای FCM
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      await PushNotifications.requestPermissions()
      await PushNotifications.register()
    } catch {
      // FCM هنوز پیکربندی نشده — اعلان محلی کافی است
    }
    return { status: 'granted', message: 'اعلان‌ها فعال شد' }
  } catch {
    return { status: 'unsupported', message: 'اعلان روی این دستگاه پشتیبانی نمی‌شود' }
  }
}

// ---------- Web / PWA ----------
async function enableWeb(): Promise<{ status: NotificationStatus; message: string }> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { status: 'unsupported', message: 'مرورگر شما از اعلان پشتیبانی نمی‌کند' }
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return { status: 'unsupported', message: 'پوش‌نوتیفیکیشن پیکربندی نشده است' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return {
      status: 'denied',
      message: 'دسترسی اعلان داده نشد — می توانید از تنظیمات مرورگر فعال کنید',
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })
    const json = subscription.toJSON()
    const res = await fetch('/api/v1/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent.slice(0, 300),
      }),
    })
    if (!res.ok) throw new Error('subscribe failed')
    return { status: 'granted', message: 'اعلان‌ها فعال شد' }
  } catch {
    return { status: 'granted', message: 'دسترسی فعال شد ولی ثبت اشتراک ناموفق بود' }
  }
}

// لغو اشتراک Web Push — برای خروج/غیرفعال‌سازی
export async function disableWebPush(): Promise<void> {
  if (isNativeApp() || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await fetch('/api/v1/notifications/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {})
      await subscription.unsubscribe().catch(() => {})
    }
  } catch {
    // لغو اختیاری است
  }
}
