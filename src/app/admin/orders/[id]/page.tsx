import type { Metadata } from 'next'
import { AdminOrderDetailClient } from '@/components/admin/order-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
}

export default function AdminOrderDetailPage() {
  return <AdminOrderDetailClient />
}
