import type { Metadata } from 'next'
import { AdminOrderDetailClient } from '@/components/admin/order-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
}

export default function AdminOrderDetailPage() {
  return <AdminOrderDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
