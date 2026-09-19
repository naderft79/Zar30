// ============================================
// Zar30 - Service Worker Registration
// ============================================
// ثبت SW در Web target — در Mobile (Capacitor) غیرفعال
// ============================================

'use client'

import { useEffect } from 'react'
import { isNative } from '@/lib/platform/platform'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // در Capacitor native app نیازی به SW نیست
    if (isNative()) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/serwist/sw.js', {
          scope: '/',
        })

        // بررسی به‌روزرسانی
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // نسخه جدید آماده است — می توان به کاربر اطلاع داد
                console.log('New service worker available')
              }
            })
          }
        })
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return null
}
