import type { Metadata } from 'next'
import { AdminSystemHealthClient } from '@/components/admin/system-health-client'

export const metadata: Metadata = {
  title: 'سلامت سیستم',
}

export default function AdminSystemHealthPage() {
  return <AdminSystemHealthClient />
}
