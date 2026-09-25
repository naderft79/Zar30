import type { Metadata } from 'next'
import { AdminWithdrawalDetailClient } from '@/components/admin/withdrawal-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات برداشت',
}

export default function AdminWithdrawalDetailPage() {
  return <AdminWithdrawalDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
