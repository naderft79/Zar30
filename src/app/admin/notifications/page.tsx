import type { Metadata } from 'next'
import { AdminNotificationsClient } from '@/components/admin/notifications-client'

export const metadata: Metadata = {
  title: 'اعلان‌ها',
}

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />
}
