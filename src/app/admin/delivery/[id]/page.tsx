import type { Metadata } from 'next'
import { AdminDeliveryDetailClient } from '@/components/admin/delivery-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات تحویل فیزیکی',
}

export default function AdminDeliveryDetailPage() {
  return <AdminDeliveryDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
