import type { Metadata } from 'next'
import { AdminTransferDetailClient } from '@/components/admin/transfer-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات انتقال',
}

export default function AdminTransferDetailPage() {
  return <AdminTransferDetailClient />
}
