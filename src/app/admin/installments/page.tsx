import type { Metadata } from 'next'
import { AdminInstallmentsClient } from '@/components/admin/operations-list-clients'

export const metadata: Metadata = { title: 'خرید قسطی' }
export default function AdminInstallmentsPage() {
  return <AdminInstallmentsClient />
}
