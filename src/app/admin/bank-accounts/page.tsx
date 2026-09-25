import type { Metadata } from 'next'
import { AdminBankAccountsClient } from '@/components/admin/bank-accounts-client'

export const metadata: Metadata = {
  title: 'کارت‌های بانکی',
}

export default function AdminBankAccountsPage() {
  return <AdminBankAccountsClient />
}
