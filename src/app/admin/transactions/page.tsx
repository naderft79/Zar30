import type { Metadata } from 'next'
import { AdminTransactionsClient } from '@/components/admin/transactions-list-client'

export const metadata: Metadata = {
  title: 'تراکنش‌ها',
}

export default function AdminTransactionsPage() {
  return <AdminTransactionsClient />
}
