import type { Metadata } from 'next'
import { AdminAccountDetailClient } from '@/components/admin/account-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات حساب دارایی',
}

export default function AdminAccountDetailPage() {
  return <AdminAccountDetailClient />
}
