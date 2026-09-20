import type { Metadata } from 'next'
import { AdminWalletDetailClient } from '@/components/admin/wallet-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات کیف پول',
}

export default function AdminWalletDetailPage() {
  return <AdminWalletDetailClient />
}
