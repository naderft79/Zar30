// ============================================
// Zar30 - Geolocation Helper (Client)
// ============================================
// دریافت موقعیت کاربر برای آدرس دقیق تحویل فیزیکی طلا
//   Native → Capacitor Geolocation (ACCESS_FINE_LOCATION)
//   Web/PWA → navigator.geolocation (HTTPS اجباری)
// ============================================

import { isNativeApp } from './capacitor'

export interface GeoResult {
  ok: boolean
  latitude?: number
  longitude?: number
  /** پیام فارسی برای نمایش به کاربر */
  message?: string
}

export async function getCurrentPosition(): Promise<GeoResult> {
  if (typeof window === 'undefined') return { ok: false, message: 'در دسترس نیست' }

  if (isNativeApp()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        return {
          ok: false,
          message: 'دسترسی موقعیت مکانی داده نشد — از تنظیمات گوشی فعال کنید',
        }
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      return { ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    } catch {
      return { ok: false, message: 'دریافت موقعیت ممکن نشد — GPS را بررسی کنید' }
    }
  }

  if (!('geolocation' in navigator)) {
    return { ok: false, message: 'مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) =>
        resolve({
          ok: false,
          message:
            err.code === err.PERMISSION_DENIED
              ? 'دسترسی موقعیت مکانی داده نشد — از تنظیمات مرورگر فعال کنید'
              : 'دریافت موقعیت ممکن نشد — دوباره تلاش کنید',
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  })
}
