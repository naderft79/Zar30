import type { Metadata } from 'next'
import { AdminWithdrawalDetailClient } from '@/components/admin/withdrawal-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات برداشت',
}

export default function AdminWithdrawalDetailPage() {
  return <AdminWithdrawalDetailClient />
}
