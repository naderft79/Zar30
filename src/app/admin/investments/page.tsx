import type { Metadata } from 'next'
import { AdminInvestmentsClient } from '@/components/admin/operations-list-clients'

export const metadata: Metadata = { title: 'سرمایه‌گذاری' }
export default function AdminInvestmentsPage() {
  return <AdminInvestmentsClient />
}
