// ============================================
// Zar30 - Onboarding Gate (Native App Entry)
// ============================================
// فقط در اپ native (Android/iOS): اگر کاربر معرفی را ندیده،
// قبل از هر صفحه‌ای به /onboarding هدایت می‌شود.
// در Web/PWA غیرفعال است تا جریان سایت دست‌نخورده بماند.
// ============================================

'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isNativeApp } from '@/lib/mobile/capacitor'
import { ONBOARDING_STORAGE_KEY } from '@/components/onboarding/onboarding-data'

export function OnboardingGate() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // فقط اپ native — وب مسیر خودش را دارد
    if (!isNativeApp()) return
    // روی خود صفحه معرفی redirect نزن — حلقه می‌شود
    if (pathname === '/onboarding') return
    try {
      if (localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true') {
        router.replace('/onboarding')
      }
    } catch {
      // ignore storage errors
    }
  }, [pathname, router])

  return null
}
