import type { Metadata } from 'next'
import { AdminReferralsClient } from '@/components/admin/operations-list-clients'

export const metadata: Metadata = { title: 'برنامه معرفی' }
export default function AdminReferralsPage() {
  return <AdminReferralsClient />
}
