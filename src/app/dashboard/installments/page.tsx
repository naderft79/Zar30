// ============================================
// Zarnama - Installments (قسطی) — Preview
// ============================================
// مقصد چهارم قرارداد ناوبری — طرح‌های اقساطی و قراردادها
// Phase 3.1: فقط Preview — هیچ Financial Logic نیست
// ============================================

import type { Metadata } from 'next'
import { PageHeader } from '@/components/panel/page-header'
import { InstallmentsClient } from '@/components/panel/installments-client'

export const metadata: Metadata = { title: 'خرید قسطی' }

export default function InstallmentsPage() {
  return (
    <>
      <PageHeader title="خرید قسطی" description="طرح‌های اقساطی و قراردادهای شما" />
      <InstallmentsClient />
    </>
  )
}
