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
  NetworkFirst,
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
// Financial API Blocklist
// ============================================
// این APIها هرگز cache نمی شوند و نباید Offline اجرا شوند
const FINANCIAL_API_PATTERNS = [
  /\/api\/v1\/orders/,
  /\/api\/v1\/wallet\/deposit/,
  /\/api\/v1\/wallet\/withdraw/,
  /\/api\/v1\/wallet\/transfer/,
  /\/api\/v1\/installments/,
  /\/api\/v1\/investments/,
  /\/api\/v1\/auth\/otp/,
  /\/api\/v1\/payments/,
]

const isFinancialApi = (url: URL): boolean => {
  return FINANCIAL_API_PATTERNS.some((pattern) => pattern.test(url.pathname))
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API های مالی — فقط Network، بدون Cache
    {
      matcher: ({ url }) => isFinancialApi(url),
      handler: new NetworkOnly(),
    },
    // سایر APIها — NetworkFirst با fallback
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
      }),
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
