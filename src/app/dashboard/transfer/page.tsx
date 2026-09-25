// ============================================
// Zar30 - Transfer — انتقال / هدیه به کاربر زرسی
// ============================================

import type { Metadata } from 'next'
import { TransferPageClient } from '@/components/panel/financial-action-pages'

export const metadata: Metadata = { title: 'انتقال به کاربر زرسی' }

export default function TransferPage() {
  return <TransferPageClient />
}
