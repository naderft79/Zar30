// ============================================
// Zar30 - Delivery — تحویل فیزیکی طلا
// ============================================

import type { Metadata } from 'next'
import { DeliveryPageClient } from '@/components/panel/financial-action-pages'

export const metadata: Metadata = { title: 'تحویل فیزیکی طلا' }

export default function DeliveryPage() {
  return <DeliveryPageClient />
}
