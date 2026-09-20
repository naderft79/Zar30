import type { Metadata } from 'next'
import { AdminOrdersClient } from '@/components/admin/orders-list-client'

export const metadata: Metadata = {
  title: 'سفارش‌ها',
}

export default function AdminOrdersPage() {
  return <AdminOrdersClient />
}
