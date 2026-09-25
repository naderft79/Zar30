// ============================================
// Zar30 - Panel Local Cache (Instant Hydration)
// ============================================
// آخرین داده‌های پنل در localStorage نگه‌داری می‌شود تا
// موجودی/پروفایل در همان فریم اول رندر شود و fetch فقط
// در پس‌زمینه تازه‌سازی کند — بدون هیچ skeleton یا باکس خالی.
// - کلیدها با userId اسکوپ می‌شوند (جلوگیری از نشت بین حساب‌ها)
// - usePanelCache با useSyncExternalStore → بدون hydration mismatch
// - logout → clearPanelCache همه را پاک می‌کند
// ============================================

'use client'

import { useSyncExternalStore } from 'react'

const PREFIX = 'zar30:panel:'

// snapshot پارس‌شده per key — getSnapshot باید مرجع پایدار برگرداند
const mem = new Map<string, unknown>()

export function readPanelCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  if (mem.has(key)) return (mem.get(key) as T | null) ?? null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    const value = raw ? ((JSON.parse(raw) as { v: T }).v ?? null) : null
    mem.set(key, value)
    return value
  } catch {
    return null
  }
}

export function writePanelCache(key: string, value: unknown): void {
  mem.set(key, value)
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: value }))
  } catch {
    // quota/storage غیرفعال — کش اختیاری است
  }
}

export function clearPanelCache(): void {
  mem.clear()
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k)
    }
  } catch {
    // پاک‌سازی اختیاری است
  }
}

const noopSubscribe = () => () => {}

// خواندن کش به‌صورت reactive — سرور null برمی‌گرداند، کلاینت مقدار cached
// (useSyncExternalStore قبل از paint re-render می‌کند، پس کاربر هیچ
// فریم خالی نمی‌بیند)
export function usePanelCache<T>(key: string): T | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => readPanelCache<T>(key),
    () => null,
  )
}
