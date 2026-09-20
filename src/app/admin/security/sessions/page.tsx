import type { Metadata } from 'next'
import { AdminSecuritySessionsClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'نشست‌های سیستم' }
export default function Page() {
  return <AdminSecuritySessionsClient />
}
