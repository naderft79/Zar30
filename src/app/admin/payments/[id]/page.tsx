import type { Metadata } from 'next'
import { AdminPaymentDetailClient } from '@/components/admin/payment-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات پرداخت',
}

export default function AdminPaymentDetailPage() {
  return <AdminPaymentDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
