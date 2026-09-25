// ============================================
// Zar30 - Capacitor Runtime Helpers
// ============================================
// تشخیص محیط: Web/PWA vs Native (APK) — safe import برای SSR
// ============================================

import { Capacitor } from '@capacitor/core'

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

export function getPlatform(): 'web' | 'android' | 'ios' {
  return Capacitor.getPlatform() as 'web' | 'android' | 'ios'
}
