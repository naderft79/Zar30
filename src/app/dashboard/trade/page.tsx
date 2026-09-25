// ============================================
// Zar30 - Trade (معاملات) — Preview
// ============================================
// مقصد دوم قرارداد ناوبری — همه قابلیت‌های آینده Trading زیر همین مسیر
// Phase 3.1: فقط Preview/Empty State — هیچ Financial Logic نیست
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TradeClient } from '@/components/panel/trade-client'

export const metadata: Metadata = { title: 'معاملات' }

export default function TradePage() {
  return (
    <Suspense>
      <TradeClient />
    </Suspense>
  )
}
