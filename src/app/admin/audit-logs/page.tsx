import type { Metadata } from 'next'
import { AdminAuditLogsClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'لاگ ممیزی' }
export default function Page() {
  return <AdminAuditLogsClient />
}
