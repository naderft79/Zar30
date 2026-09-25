import type { Metadata } from 'next'
import { AdminBankAccountDetailClient } from '@/components/admin/bank-account-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات کارت بانکی',
}

export default function AdminBankAccountDetailPage() {
  return <AdminBankAccountDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
