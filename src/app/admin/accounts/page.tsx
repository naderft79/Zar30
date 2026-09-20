import type { Metadata } from 'next'
import { AdminAccountsClient } from '@/components/admin/accounts-list-client'

export const metadata: Metadata = {
  title: 'حساب‌های دارایی',
}

export default function AdminAccountsPage() {
  return <AdminAccountsClient />
}
