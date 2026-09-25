import type { Metadata } from 'next'
import { AdminReconciliationClient } from '@/components/admin/reconciliation-client'

export const metadata: Metadata = {
  title: 'تطبیق دفتر کل',
}

export default function AdminReconciliationPage() {
  return <AdminReconciliationClient />
}
