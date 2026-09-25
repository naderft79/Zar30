import type { Metadata } from 'next'
import { AdminReportsClient } from '@/components/admin/reports-client'

export const metadata: Metadata = {
  title: 'گزارش‌ها',
}

export default function AdminReportsPage() {
  return <AdminReportsClient />
}
