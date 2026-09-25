// ============================================
// Zar30 - Deposit — واریز به کیف پول
// ============================================

import type { Metadata } from 'next'
import { DepositPageClient } from '@/components/panel/financial-action-pages'

export const metadata: Metadata = { title: 'واریز به کیف پول' }

export default function DepositPage() {
  return <DepositPageClient />
}
