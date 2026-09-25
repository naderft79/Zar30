import type { Metadata } from 'next'
import { AdminDeliveryClient } from '@/components/admin/delivery-list-client'

export const metadata: Metadata = {
  title: 'تحویل فیزیکی',
}

export default function AdminDeliveryPage() {
  return <AdminDeliveryClient />
}
