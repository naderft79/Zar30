// ============================================
// Zarnama - Platform Detection & Abstraction
// ============================================
// تشخیص Web / Mobile (Capacitor) و ارائه API مشترک
// Shared Codebase → Web Target + Mobile Target
// ============================================

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// آیا داخل Capacitor native app هستیم؟
export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

// آیا روی Android هستیم؟
export const isAndroid = (): boolean => isNative() && Capacitor.getPlatform() === 'android'

// آیا روی iOS هستیم؟
export const isIos = (): boolean => isNative() && Capacitor.getPlatform() === 'ios'

// آیا روی Web هستیم؟
export const isWeb = (): boolean => !isNative()

// ============================================
// Secure Storage Abstraction
// ============================================
// Web: فقط برای داده‌های غیرحساس (tokens در httpOnly cookie هستند)
// Mobile: Capacitor Preferences (Keychain/Keystore در native)

const TOKEN_KEY = 'zarnama_refresh_token'

// ذخیره refresh token (فقط برای Mobile — Web از httpOnly cookie استفاده می‌کند)
export async function saveRefreshToken(token: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key: TOKEN_KEY, value: token })
  }
  // در Web هیچ کاری نمی کنیم — refresh token در httpOnly cookie است
}

// دریافت refresh token (فقط برای Mobile)
export async function getRefreshToken(): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key: TOKEN_KEY })
    return value
  }
  return null
}

// حذف refresh token (logout)
export async function clearRefreshToken(): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key: TOKEN_KEY })
  }
}

// ============================================
// Auth Header Strategy
// ============================================
// Web: cookie-based (credentials: include)
// Mobile: Bearer token

export function getAuthHeaders(): Record<string, string> {
  // در Web کوکی خودکار ارسال می شود
  // در Mobile باید Bearer token بفرستیم
  return {}
}

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }

  // در Mobile، Bearer token را اضافه می کنیم
  if (isNative()) {
    const token = await getRefreshToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return fetch(input, {
    ...init,
    headers,
    // در Web کوکی‌ها را همراه می‌فرستیم
    ...(isWeb() && { credentials: 'include' }),
  })
}
