// ============================================
// Zarnama - Trade (معاملات) — Preview
// ============================================
// مقصد دوم قرارداد ناوبری — همه قابلیت‌های آینده Trading زیر همین مسیر
// Phase 3.1: فقط Preview/Empty State — هیچ Financial Logic نیست
// ============================================

import type { Metadata } from 'next'
import { PageHeader } from '@/components/panel/page-header'
import { TradeClient } from '@/components/panel/trade-client'

export const metadata: Metadata = { title: 'معاملات' }

export default function TradePage() {
  return (
    <>
      <PageHeader title="معاملات" description="خرید و فروش طلای آب‌شده ۱۸ عیار" />
      <TradeClient />
    </>
  )
}
