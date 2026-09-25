import type { Metadata } from 'next'
import { AdminTransactionDetailClient } from '@/components/admin/transaction-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات تراکنش',
}

export default function AdminTransactionDetailPage() {
  return <AdminTransactionDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
