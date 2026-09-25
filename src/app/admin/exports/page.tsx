import type { Metadata } from 'next'
import { AdminExportsClient } from '@/components/admin/exports-client'

export const metadata: Metadata = {
  title: 'تاریخچه خروجی‌ها',
}

export default function AdminExportsPage() {
  return <AdminExportsClient />
}
