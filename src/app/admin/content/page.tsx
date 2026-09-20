import type { Metadata } from 'next'
import { AdminContentClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'محتوا' }
export default function Page() {
  return <AdminContentClient />
}
