import type { Metadata } from 'next'
import { AdminSecurityEventsClient } from '@/components/admin/security-events-client'

export const metadata: Metadata = {
  title: 'رویدادهای امنیتی',
}

export default function AdminSecurityPage() {
  return <AdminSecurityEventsClient />
}
