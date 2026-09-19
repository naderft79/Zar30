import type { Metadata } from 'next'
import { NotificationsClient } from '@/components/panel/notifications-client'

export const metadata: Metadata = { title: 'اعلان‌ها | زرسی' }

export default function NotificationsPage() {
  return <NotificationsClient />
}
