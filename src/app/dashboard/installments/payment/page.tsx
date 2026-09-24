// ============================================
// Zar30 - Installment Payment — پرداخت هزینه خدمات اقساطی
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InstallmentPaymentClient } from '@/components/panel/installment-payment-client'

export const metadata: Metadata = { title: 'پرداخت هزینه خدمات' }

export default function InstallmentPaymentPage() {
  return (
    <Suspense>
      <InstallmentPaymentClient />
    </Suspense>
  )
}
