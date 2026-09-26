// ============================================
// Zar30 - Installments (قسطی) — Backend واقعی
// ============================================
// مقصد چهارم قرارداد ناوبری — قراردادهای اقساطی با API واقعی
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InstallmentsClient } from '@/components/panel/installments-client'

export const metadata: Metadata = { title: 'خرید قسطی' }

export default function InstallmentsPage() {
  return (
    <Suspense>
      <InstallmentsClient />
    </Suspense>
  )
}
