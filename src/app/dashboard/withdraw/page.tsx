// ============================================
// Zar30 - Withdraw — درخواست برداشت
// ============================================

import type { Metadata } from 'next'
import { WithdrawPageClient } from '@/components/panel/financial-action-pages'

export const metadata: Metadata = { title: 'درخواست برداشت' }

export default function WithdrawPage() {
  return <WithdrawPageClient />
}
