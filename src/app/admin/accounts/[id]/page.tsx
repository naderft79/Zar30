import type { Metadata } from 'next'
import { AdminAccountDetailClient } from '@/components/admin/account-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات حساب دارایی',
}

export default function AdminAccountDetailPage() {
  return <AdminAccountDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
