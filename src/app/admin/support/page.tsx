import type { Metadata } from 'next'
import { AdminSupportClient } from '@/components/admin/operations-list-clients'

export const metadata: Metadata = { title: 'مرکز پشتیبانی' }
export default function AdminSupportPage() {
  return <AdminSupportClient />
}
