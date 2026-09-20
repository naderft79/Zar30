import type { Metadata } from 'next'
import { AdminNotificationsClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'اعلان‌ها' }
export default function Page() {
  return <AdminNotificationsClient />
}
