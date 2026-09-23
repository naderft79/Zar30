// ============================================
// Zar30 - Installment Checkout — صورتحساب خرید قسطی
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InstallmentCheckoutClient } from '@/components/panel/installment-checkout-client'

export const metadata: Metadata = { title: 'صورتحساب خرید قسطی' }

export default function InstallmentCheckoutPage() {
  return (
    <Suspense>
      <InstallmentCheckoutClient />
    </Suspense>
  )
}
