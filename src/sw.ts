/// <reference lib="webworker" />
// ============================================
// Zar30 - Service Worker (Serwist v9)
// ============================================
// این فایل Service Worker را برای PWA می سازد
// فقط محتوای غیرمالی cache می شود
// عملیات مالی هرگز Offline Queue نمی شوند
// ============================================

import { defaultCache } from '@serwist/turbopack/worker'
import {
  Serwist,
  NetworkOnly,
  CacheFirst,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from 'serwist'

// تعریف __SW_MANIFEST روی global scope (توسط Serwist تزریق می شود)
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// ============================================
// API Cache Policy
// ============================================
// تمام APIها (موجودی، قیمت، تراکنش، کیف پول، سفارش، کاربر، ادمین) هرگز cache
// نمی شوند — داده stale هرگز حقیقت مالی نیست و عملیات مالی Offline Queue نمی‌شود.
// NetworkFirst روی /api/ می توانست پاسخ قدیمی را به‌عنوان state فعلی برگرداند.
const isApi = (url: URL): boolean => url.pathname.startsWith('/api/')

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // تمام APIها — فقط Network، بدون Cache
    {
      matcher: ({ url }) => isApi(url),
      handler: new NetworkOnly(),
    },
    // تصاویر
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'image-cache',
      }),
    },
    // فونت‌ها
    {
      matcher: ({ request }) => request.destination === 'font',
      handler: new CacheFirst({
        cacheName: 'font-cache',
      }),
    },
    // سایر استاتیک‌ها
    ...defaultCache,
  ],
})

serwist.addEventListeners()

// ============================================
// Web Push — دریافت اعلان و نمایش سیستمی
// ============================================

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    payload = { title: 'زرسی', body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'زرسی', {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      dir: 'rtl',
      lang: 'fa',
      tag: payload.tag,
      data: { url: payload.url ?? '/dashboard/notifications', ...payload.data },
    }),
  )
})

// کلیک روی اعلان — فوکوس تب موجود یا بازکردن تب جدید
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/dashboard/notifications'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        void existing.focus()
        return existing.navigate(url)
      }
      return self.clients.openWindow(url)
    }),
  )
})
