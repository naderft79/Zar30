// ============================================
// Zar30 - Native Auth Token Store
// ============================================
// Web: توکن‌ها در httpOnly cookie هستند و این لایه استفاده نمی‌شود
// Native (APK): توکن‌ها در Capacitor Preferences ذخیره و با
//   Authorization: Bearer ارسال می‌شوند — سرور هر دو را می‌پذیرد
// ============================================

import { Preferences } from '@capacitor/preferences'
import { isNativeApp } from './capacitor'

const ACCESS_KEY = 'zar30.access'
const REFRESH_KEY = 'zar30.refresh'

export async function saveNativeTokens(accessToken: string, refreshToken: string) {
  if (!isNativeApp()) return
  await Preferences.set({ key: ACCESS_KEY, value: accessToken })
  await Preferences.set({ key: REFRESH_KEY, value: refreshToken })
}

export async function getNativeAccessToken(): Promise<string | null> {
  if (!isNativeApp()) return null
  const { value } = await Preferences.get({ key: ACCESS_KEY })
  return value
}

export async function getNativeRefreshToken(): Promise<string | null> {
  if (!isNativeApp()) return null
  const { value } = await Preferences.get({ key: REFRESH_KEY })
  return value
}

export async function clearNativeTokens() {
  if (!isNativeApp()) return
  await Preferences.remove({ key: ACCESS_KEY })
  await Preferences.remove({ key: REFRESH_KEY })
}
